// 이용약관·개인정보 처리방침 원문(src/content/legal/*.md)을 화면용 블록으로 나눈다.
// 원문 문구는 바꾸지 않는다 — 이 문서들에 쓰인 문법(#·##·### 제목, ---, 표, 번호·글머리 목록과 들여쓴 하위 목록,
// **굵게**)만 해석하고, 그 밖의 줄은 문단으로 그대로 둔다.
const LIST_ITEM = /^(\s*)(\d+\.|-) (.*)$/
const TABLE_ROW = /^\|.*\|$/
const META_ITEM = /^(문서 버전|시행일): (.*)$/

function parseBlocks(lines) {
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i += 1; continue }
    const heading = line.match(/^(#{1,3}) (.*)$/)
    if (heading) { blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] }); i += 1; continue }
    if (line.trim() === '---') { blocks.push({ type: 'rule' }); i += 1; continue }
    if (TABLE_ROW.test(line)) {
      const rows = []
      while (i < lines.length && TABLE_ROW.test(lines[i])) { rows.push(lines[i]); i += 1 }
      const cells = (row) => row.slice(1, -1).split('|').map((cell) => cell.trim())
      blocks.push({ type: 'table', head: cells(rows[0]), rows: rows.slice(2).map(cells) })
      continue
    }
    if (LIST_ITEM.test(line)) {
      const items = []
      while (i < lines.length && LIST_ITEM.test(lines[i])) {
        const [, indent, marker, text] = lines[i].match(LIST_ITEM)
        items.push({ depth: indent.length > 0 ? 1 : 0, ordered: marker !== '-', number: marker === '-' ? null : Number.parseInt(marker, 10), text })
        i += 1
      }
      blocks.push(toList(items))
      continue
    }
    const paragraph = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |\||---$)/.test(lines[i]) && !LIST_ITEM.test(lines[i])) { paragraph.push(lines[i]); i += 1 }
    blocks.push({ type: 'paragraph', lines: paragraph })
  }
  return blocks
}

// 들여쓴 항목(depth 1)은 바로 앞 항목의 하위 목록이 된다.
function toList(items) {
  const top = items.filter((item) => item.depth === 0)
  const list = { type: 'list', ordered: top[0]?.ordered ?? false, items: [] }
  for (const item of items) {
    if (item.depth === 0 || !list.items.length) { list.items.push({ number: item.number, text: item.text, children: null }); continue }
    const parent = list.items.at(-1)
    parent.children ??= { type: 'list', ordered: item.ordered, items: [] }
    parent.children.items.push({ number: item.number, text: item.text, children: null })
  }
  return list
}

// { title, meta: { 문서 버전, 시행일 }, preamble: 블록[], sections: [{ id, heading, blocks }] }
export function parseLegalDocument(source) {
  const blocks = parseBlocks(source.replace(/\r\n/g, '\n').split('\n')).filter((block) => block.type !== 'rule')
  const doc = { title: '', meta: {}, preamble: [], sections: [] }
  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 1 && !doc.title) { doc.title = block.text; continue }
    // 제목 바로 아래 "문서 버전·시행일" 목록은 머리말에 따로 보여 준다.
    if (!doc.sections.length && !doc.preamble.length && block.type === 'list' && block.items.every((item) => META_ITEM.test(item.text))) {
      for (const item of block.items) { const [, key, value] = item.text.match(META_ITEM); doc.meta[key] = value }
      continue
    }
    if (block.type === 'heading' && block.level === 2) { doc.sections.push({ id: `section-${doc.sections.length + 1}`, heading: block.text, blocks: [] }); continue }
    if (doc.sections.length) doc.sections.at(-1).blocks.push(block)
    else doc.preamble.push(block)
  }
  return doc
}
