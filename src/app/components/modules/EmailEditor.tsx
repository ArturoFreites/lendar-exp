import React, { useMemo, useRef } from 'react';
import { useEditor, EditorContent, type Content } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '../ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  RemoveFormatting,
  ImagePlus,
  Palette,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
} from 'lucide-react';

interface EmailEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

const PRESET_COLORS = [
  '#1f2a2a',
  '#55c3c5',
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#ca8a04',
];

/** Extensión para tamaño de fuente (extiende TextStyle). */
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        parseHTML: (el) => (el as HTMLElement).style?.fontSize?.replace(/['"]/g, '') ?? undefined,
        renderHTML: (attrs) => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
      },
    };
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: { chain: () => { focus: () => { setMark: (name: string, attrs: object) => { run: () => boolean } } } }) =>
          chain().focus().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: { chain: () => { focus: () => { unsetMark: (name: string) => { run: () => boolean } } } }) =>
          chain().focus().unsetMark('textStyle').run(),
    };
  },
});

const FONT_SIZES = [
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '15px', value: '15px' },
  { label: '18px', value: '18px' },
  { label: '24px', value: '24px' },
];

/** Extensión Image con alineación (izquierda, centro, derecha). */
const ImageWithAlign = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-align') || (el as HTMLElement).style?.textAlign || null,
        renderHTML: (attrs) => {
          if (!attrs.align || attrs.align === 'left') return {};
          const marginStyle =
            attrs.align === 'center'
              ? 'display:block; margin-left:auto; margin-right:auto;'
              : attrs.align === 'right'
                ? 'display:block; margin-left:auto; margin-right:0;'
                : '';
          return marginStyle ? { style: marginStyle, 'data-align': attrs.align } : {};
        },
      },
    };
  },
  addCommands() {
    return {
      setImageAlign:
        (align: 'left' | 'center' | 'right') =>
        ({ chain }: { chain: () => { focus: () => { updateAttributes: (name: string, attrs: object) => { run: () => boolean } } } }) =>
          chain().focus().updateAttributes('image', { align: align === 'left' ? null : align }).run(),
    };
  },
});

/** Extensión Link que preserva class y style (p. ej. email-cta-button) al centrar o formatear. */
const LinkWithCtaButton = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('class') ?? null,
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
      style: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('style') ?? null,
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

/** Inserta un enlace con estilo de botón CTA (mismo formato que el email enviado). La clase email-cta-button asegura que la vista previa lo muestre siempre como botón. */
function buildCtaButtonHtml(href: string, text: string): string {
  const style = 'display:inline-block; background:#38bdb8; color:#fff; font-weight:700; font-size:15px; padding:14px 32px; border-radius:8px; text-decoration:none;';
  return `<a href="${href.replace(/"/g, '&quot;')}" class="email-cta-button" style="${style}">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a>`;
}

export function EmailEditor({ value, onChange, placeholder, minHeight = '280px', className = '' }: EmailEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<HTMLInputElement>(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      LinkWithCtaButton.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener' },
      }),
      Underline,
      ImageWithAlign.configure({
        allowBase64: true,
        HTMLAttributes: { style: 'max-width:100%; height:auto;' },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontSize,
      Color,
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: (value || '<p></p>') as Content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] px-4 py-3 focus:outline-none text-[#1f2a2a]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className={`border border-[#4a494d]/20 rounded-lg overflow-hidden bg-white shadow-inner ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[#4a494d]/10 bg-[#f8f9fa]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Subrayado"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Tachado"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <span className="w-px h-5 bg-[#4a494d]/20 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Título 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Título 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Título 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <span className="w-px h-5 bg-[#4a494d]/20 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Alinear a la izquierda"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Centrar"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Alinear a la derecha"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Tamaño de texto">
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-wrap gap-1">
              {FONT_SIZES.map(({ label, value }) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor.chain().focus().setFontSize(value).run()}
                >
                  {label}
                </Button>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().unsetFontSize().run()}>
                Quitar tamaño
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <span className="w-px h-5 bg-[#4a494d]/20 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Lista"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('URL del hipervínculo:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={editor.isActive('link') ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
          title="Hipervínculo (solo enlace, sin estilo de botón)"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('URL del botón:');
            if (!url) return;
            const text = window.prompt('Texto del botón:', 'Ir');
            const label = text?.trim() || 'Ir';
            editor.chain().focus().insertContent(buildCtaButtonHtml(url, label)).run();
          }}
          title="Botón CTA (enlace con estilo de botón del email)"
        >
          <Square className="h-4 w-4" />
        </Button>
        <span className="w-px h-5 bg-[#4a494d]/20 mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Imagen (URL o subir archivo)">
              <ImagePlus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#6b6a6e]">URL de la imagen</label>
              <input
                ref={imageUrlRef}
                type="url"
                placeholder="https://..."
                className="flex h-9 w-full rounded-md border border-[#4a494d]/20 bg-white px-3 py-1 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const url = (e.target as HTMLInputElement).value?.trim();
                    if (url) {
                      editor.chain().focus().setImage({ src: url }).run();
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const url = imageUrlRef.current?.value?.trim();
                  if (url) {
                    editor.chain().focus().setImage({ src: url }).run();
                    imageUrlRef.current.value = '';
                  }
                }}
              >
                Insertar desde URL
              </Button>
              <div className="border-t border-[#4a494d]/10 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => imageInputRef.current?.click()}
                >
                  Subir imagen (archivo)
                </Button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const dataUrl = ev.target?.result as string;
                      if (dataUrl) editor.chain().focus().setImage({ src: dataUrl }).run();
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {editor.isActive('image') && (
          <>
            <span className="w-px h-5 bg-[#4a494d]/20 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setImageAlign('left').run()}
              className={editor.getAttributes('image').align !== 'center' && editor.getAttributes('image').align !== 'right' ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
              title="Imagen a la izquierda"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setImageAlign('center').run()}
              className={editor.getAttributes('image').align === 'center' ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
              title="Centrar imagen"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setImageAlign('right').run()}
              className={editor.getAttributes('image').align === 'right' ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
              title="Imagen a la derecha"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={editor.isActive('textStyle') ? 'bg-[#55c3c5]/20 text-[#55c3c5]' : ''}
              title="Color de texto"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-wrap gap-1">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className="w-6 h-6 rounded border border-[#4a494d]/20 hover:ring-2 ring-[#55c3c5]"
                  style={{ backgroundColor: hex }}
                  title={hex}
                  onClick={() => editor.chain().focus().setColor(hex).run()}
                />
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().unsetColor().run()}>
                Quitar color
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Quitar formato"
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
