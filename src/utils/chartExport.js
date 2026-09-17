const PALETTE = ['#397ff1', '#78adf9', '#59cfb4', '#60c4c4', '#9468e8', '#f2994a', '#eb5757', '#56ccf2', '#bb6bd9', '#27ae60']
const WIDTH = 640
const HEIGHT = 380

function baseCanvas(title) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = '#101938'
  ctx.font = 'bold 18px "Pretendard", sans-serif'
  ctx.fillText(title.length > 46 ? `${title.slice(0, 46)}…` : title, 24, 40)
  return { canvas, ctx }
}

function drawPie(ctx, counts, total) {
  const cx = 160
  const cy = 220
  const radius = 110
  let start = -Math.PI / 2
  if (!total) {
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#eef1f6'
    ctx.fill()
  } else {
    counts.forEach((item, index) => {
      const angle = (item.count / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, start, start + angle)
      ctx.closePath()
      ctx.fillStyle = PALETTE[index % PALETTE.length]
      ctx.fill()
      start += angle
    })
  }
  ctx.font = '13px "Pretendard", sans-serif'
  counts.forEach((item, index) => {
    const percent = total ? Math.round((item.count / total) * 100) : 0
    const y = 90 + index * 26
    ctx.fillStyle = PALETTE[index % PALETTE.length]
    ctx.fillRect(340, y - 11, 12, 12)
    ctx.fillStyle = '#101938'
    const label = String(item.option).length > 22 ? `${String(item.option).slice(0, 22)}…` : String(item.option)
    ctx.fillText(`${label}  ${percent}% (${item.count}명)`, 360, y)
  })
}

function drawHorizontalBars(ctx, counts, total) {
  const top = 80
  const rowHeight = Math.min(46, (HEIGHT - top - 30) / Math.max(1, counts.length))
  const trackX = 190
  const trackWidth = WIDTH - trackX - 90
  ctx.font = '13px "Pretendard", sans-serif'
  counts.forEach((item, index) => {
    const percent = total ? item.count / total : 0
    const y = top + index * rowHeight
    const label = String(item.option).length > 20 ? `${String(item.option).slice(0, 20)}…` : String(item.option)
    ctx.fillStyle = '#101938'
    ctx.fillText(label, 24, y + rowHeight / 2 + 4)
    ctx.fillStyle = '#eef1f6'
    ctx.fillRect(trackX, y + 8, trackWidth, rowHeight - 20)
    ctx.fillStyle = PALETTE[index % PALETTE.length]
    ctx.fillRect(trackX, y + 8, trackWidth * percent, rowHeight - 20)
    ctx.fillStyle = '#101938'
    ctx.fillText(`${Math.round(percent * 100)}%`, WIDTH - 70, y + rowHeight / 2 + 4)
  })
}

function drawVerticalBars(ctx, counts, total) {
  const left = 50
  const bottom = HEIGHT - 50
  const chartHeight = bottom - 90
  const colWidth = (WIDTH - left - 40) / Math.max(1, counts.length)
  const maxPercent = Math.max(...counts.map((item) => (total ? item.count / total : 0)), 0.05)
  ctx.font = '13px "Pretendard", sans-serif'
  ctx.textAlign = 'center'
  counts.forEach((item, index) => {
    const percent = total ? item.count / total : 0
    const barHeight = chartHeight * (percent / maxPercent)
    const x = left + index * colWidth
    ctx.fillStyle = PALETTE[index % PALETTE.length]
    ctx.fillRect(x + colWidth * 0.22, bottom - barHeight, colWidth * 0.56, barHeight)
    ctx.fillStyle = '#101938'
    ctx.fillText(String(item.option), x + colWidth / 2, bottom + 20)
    ctx.fillText(`${item.count}명`, x + colWidth / 2, bottom - barHeight - 8)
  })
  ctx.textAlign = 'left'
}

function triggerDownload(canvas, filename) {
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = filename
  link.click()
}

export function isChartable(question) {
  return question.type !== 'text' && question.type !== 'long'
}

export function renderQuestionChart(question, analysis) {
  const { canvas, ctx } = baseCanvas(question.title)
  const total = analysis.values.length
  if (question.type === 'single') drawPie(ctx, analysis.counts, total)
  else if (question.type === 'scale') drawVerticalBars(ctx, analysis.counts, total)
  else drawHorizontalBars(ctx, analysis.counts, total)
  return canvas
}

export function downloadQuestionChart(question, analysis, index) {
  if (!isChartable(question)) return
  const canvas = renderQuestionChart(question, analysis)
  triggerDownload(canvas, `${String(index + 1).padStart(2, '0')}-${question.title.slice(0, 20)}.png`)
}

export function downloadAllCharts(surveyTitle, questions, analyses) {
  questions.forEach((question, index) => {
    if (!isChartable(question)) return
    window.setTimeout(() => {
      const canvas = renderQuestionChart(question, analyses[index])
      triggerDownload(canvas, `${surveyTitle.slice(0, 20)}-Q${String(index + 1).padStart(2, '0')}.png`)
    }, index * 260)
  })
}
