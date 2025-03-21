import { FlattedOptionType, IconsType } from '../treeselectTypes'

export interface ITreeselectInputParams {
  value: FlattedOptionType[]
  showTags: boolean
  tagsCountText: string
  clearable: boolean
  isAlwaysOpened: boolean
  searchable: boolean
  placeholder: string
  disabled: boolean
  isSingleSelect: boolean
  useTitle: boolean //GK
  id: string
  ariaLabel: string
  iconElements: IconsType
  inputCallback: (value: FlattedOptionType[]) => void
  searchCallback: (value: string) => void
  openCallback: () => void
  closeCallback: () => void
  keydownCallback: (e: KeyboardEvent) => void
  focusCallback: () => void
  blurCallback: () => void
  nameChangeCallback: (name: string) => void
  onTagEnterCallback: (value: string | number, inList: boolean) => void //GK
  onTagLeaveCallback: (value: string | number, inList: boolean) => void //GK
}

export interface ITreeselectInput extends ITreeselectInputParams {
  isOpened: boolean
  searchText: string
  srcElement: HTMLElement | Element
  focus: () => void
  blur: () => void
  updateValue: (newValue: FlattedOptionType[]) => void
  removeItem: (id: string) => void
  clear: () => void
  openClose: () => void
  clearSearch: () => void
}
