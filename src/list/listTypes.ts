import {
  ValueOptionType,
  OptionType,
  FlattedOptionType,
  IconsType,
  SelectedNodesType,
  TagsSortFnType
} from '../treeselectTypes'

export interface ITreeselectListParams {
  options: OptionType[]
  value: ValueOptionType[]
  openLevel: number
  listSlotHtmlComponent: HTMLElement | null
  tagsSortFn: TagsSortFnType
  emptyText: string
  isSingleSelect: boolean
  useTitle?: boolean //GK
  showCount: boolean
  disabledBranchNode: boolean
  expandSelected: boolean
  isIndependentNodes: boolean
  rtl: boolean
  listClassName: string
  iconElements: IconsType
  inputCallback: (value: SelectedNodesType) => void
  arrowClickCallback: (groupId: ValueOptionType, isClosed: boolean) => void
  mouseupCallback: () => void
  onTagEnterCallback?: (value: ValueOptionType, inList: boolean) => void //GK
  onTagLeaveCallback?: (value: ValueOptionType, inList: boolean) => void //GK
}

export interface ITreeselectList extends ITreeselectListParams {
  searchText: string
  flattedOptions: FlattedOptionType[]
  flattedOptionsBeforeSearch: FlattedOptionType[]
  selectedNodes: SelectedNodesType
  srcElement: HTMLElement
  updateValue: (value: ValueOptionType[]) => void
  updateSearchValue: (searchText: string) => void
  callKeyAction: (e: KeyboardEvent) => void
  focusFirstListElement: () => void
  isLastFocusedElementExist: () => boolean
}
