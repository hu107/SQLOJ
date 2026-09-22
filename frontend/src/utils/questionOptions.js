// 取值与后端 QuestionDTO 的校验规则一致；未知值保留原样，便于发现数据问题。
export const difficultyOptions = [
  { value: 'EASY', label: '简单' },
  { value: 'MEDIUM', label: '中等' },
  { value: 'HARD', label: '困难' },
]

export const statusOptions = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'DISABLED', label: '已停用' },
]

export const orderOptions = [
  { value: 0, label: '忽略顺序' },
  { value: 1, label: '顺序一致' },
]

export function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label ??
    (value == null || value === '' ? '—' : String(value))
}
