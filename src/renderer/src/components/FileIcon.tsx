import { fileKind } from './file-kind'
import { IconFile, IconFileImage, IconFilePdf, IconFileSheet, IconFileText } from './Icons'

/** Ícone de 16px conforme o tipo do anexo. */
export function FileIcon({
  filename,
  mime
}: {
  filename: string
  mime: string
}): React.JSX.Element {
  switch (fileKind(filename, mime)) {
    case 'image':
      return <IconFileImage />
    case 'pdf':
      return <IconFilePdf />
    case 'sheet':
      return <IconFileSheet />
    case 'text':
      return <IconFileText />
    default:
      return <IconFile />
  }
}
