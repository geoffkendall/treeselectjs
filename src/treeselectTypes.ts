export type ValueOptionType = string | number

export type ValueType = ValueOptionType[] | ValueOptionType | null

export type ValueInputType = ValueOptionType[] | ValueOptionType | null | undefined

export type OptionType = {
  value: ValueOptionType
  name: string
  longName?: string
  disabled?: boolean
  htmlAttr?: object
  isSingleSelect?: boolean
  children: OptionType[]
}

export type DirectionType = 'auto' | 'top' | 'bottom'

export type TagsSortItem = { value: ValueOptionType; name: string }
export type TagsSortFnType = ((itemA: TagsSortItem, itemB: TagsSortItem) => number) | null

export interface ITreeselect {
  parentHtmlContainer: HTMLElement
  value: ValueType
  options: OptionType[]
  openLevel: number
  appendToBody: boolean
  alwaysOpen: boolean
  showTags: boolean
  tagsCountText: string
  tagsSortFn: TagsSortFnType
  clearable: boolean
  searchable: boolean
  placeholder: string
  grouped: boolean
  isGroupedValue: boolean
  listSlotHtmlComponent: HTMLElement | null
  disabled: boolean
  emptyText: string
  staticList: boolean
  id: string
  ariaLabel: string
  isSingleSelect: boolean
  useTitle: boolean //GK
  showCount: boolean
  disabledBranchNode: boolean
  direction: DirectionType
  expandSelected: boolean
  saveScrollPosition: boolean
  isIndependentNodes: boolean
  rtl: boolean
  iconElements: IconsType
  ungroupedValue: ValueOptionType[]
  groupedValue: ValueOptionType[]
  isListOpened: boolean
  selectedName: string
  srcElement: HTMLElement | null
  inputCallback: ((value: ValueType) => void) | undefined
  openCallback: ((value: ValueType) => void) | undefined
  closeCallback: ((value: ValueType) => void) | undefined
  nameChangeCallback: ((name: string) => void) | undefined
  searchCallback: ((value: string) => void) | undefined
  openCloseGroupCallback: ((groupId: ValueOptionType, isClosed: boolean) => void) | undefined
  onTagEnter: ((value: ValueOptionType, inList: boolean) => void) | undefined //GK
  onTagLeave: ((value: ValueOptionType, inList: boolean) => void) | undefined //GK
  mount: () => void
  updateValue: (newValue: ValueInputType) => void
  destroy: () => void
  focus: () => void
  toggleOpenClose: () => void
}

export interface ITreeselectParams {
  parentHtmlContainer: HTMLElement
  value?: ValueInputType
  options?: OptionType[]
  openLevel?: number
  appendToBody?: boolean
  alwaysOpen?: boolean
  showTags?: boolean
  tagsCountText?: string
  tagsSortFn?: TagsSortFnType
  clearable?: boolean
  searchable?: boolean
  placeholder?: string
  grouped?: boolean
  isGroupedValue?: boolean
  listSlotHtmlComponent?: HTMLElement | null
  disabled?: boolean
  emptyText?: string
  staticList?: boolean
  id?: string
  ariaLabel?: string
  isSingleSelect?: boolean
  useTitle?: boolean //GK
  showCount?: boolean
  disabledBranchNode?: boolean
  direction?: DirectionType
  expandSelected?: boolean
  saveScrollPosition?: boolean
  isIndependentNodes?: boolean
  rtl?: boolean
  listClassName?: string
  iconElements?: Partial<IconsType>
  inputCallback?: (value: ValueType) => void
  openCallback?: (value: ValueType) => void
  closeCallback?: (value: ValueType) => void
  nameChangeCallback?: (name: string) => void
  searchCallback?: (value: string) => void
  openCloseGroupCallback?: (groupId: ValueOptionType, isClosed: boolean) => void
  onTagEnter?: (value: ValueOptionType, inList: boolean) => void //GK
  onTagLeave?: (value: ValueOptionType, inList: boolean) => void //GK
}

export type FlattedOptionType = {
  id: string | number
  name: string
  longName?: string
  childOf: string | number
  isGroup: boolean
  checked: boolean
  isPartialChecked: boolean
  level: number
  isClosed: boolean
  hidden: boolean
  disabled: boolean
  isSingleSelect?: boolean
  htmlAttrStr: string //GK
}

export type IconsType = {
  arrowUp: string | HTMLElement
  arrowDown: string | HTMLElement
  arrowRight: string | HTMLElement
  attention: string | HTMLElement
  clear: string | HTMLElement
  cross: string | HTMLElement
  check: string | HTMLElement
  partialCheck: string | HTMLElement
}

export type SelectedNodesType = {
  nodes: FlattedOptionType[]
  groupedNodes: FlattedOptionType[]
  allNodes: FlattedOptionType[]
}
