import {
  OptionType,
  ValueOptionType,
  FlattedOptionType,
  IconsType,
  SelectedNodesType,
  TagsSortFnType
} from '../treeselectTypes'
import { ITreeselectListParams, ITreeselectList } from './listTypes'
import { getFlattedOptions, getCheckedOptions } from './helpers/listOptionsHelper'
import { updateOptionByCheckState, updateOptionsByValue, forceUpdateAllAncestorStates } from './helpers/listCheckStateHelper'
import {
  hideShowChildrenOptions,
  updateVisibleBySearchFlattedOptions,
  expandSelectedItems
} from './helpers/listVisibilityStateHelper'
import { appendIconToElement } from '../svgIcons'

const validateOptions = (flatOptions: FlattedOptionType[]) => {
  const { duplications } = flatOptions.reduce(
    (acc, curr) => {
      if (acc.allItems.some((id) => id.toString() === curr.id.toString())) {
        acc.duplications.push(curr.id)
      }

      acc.allItems.push(curr.id)

      return acc
    },
    {
      duplications: [] as ValueOptionType[],
      allItems: [] as ValueOptionType[]
    }
  )

  if (duplications.length) {
    console.error(`Validation: You have duplicated values: ${duplications.join(', ')}! You should use unique values.`)
  }
}

const updateListValue = (
  newValue: ValueOptionType[],
  flattedOptions: FlattedOptionType[],
  srcElement: HTMLElement | Element,
  iconElements: IconsType,
  isSingleSelect: boolean,
  previousSingleSelectedValue: ValueOptionType[],
  expandSelected: boolean,
  isFirstValueUpdate: boolean,
  isIndependentNodes: boolean,
  rtl: boolean
) => {
  updateOptionsByValue(newValue, flattedOptions, isSingleSelect, isIndependentNodes)

  if (isFirstValueUpdate && expandSelected) {
    expandSelectedItems(flattedOptions)
  }

  updateDOM(flattedOptions, srcElement, iconElements, previousSingleSelectedValue, rtl)
}

const updateDOM = (
  flattedOptions: FlattedOptionType[],
  srcElement: HTMLElement | Element,
  iconElements: IconsType,
  previousSingleSelectedValue: ValueOptionType[],
  rtl: boolean
) => {
  flattedOptions.forEach((option) => {
    const input = srcElement.querySelector(`[input-id="${option.id}"]`) as HTMLInputElement
    const listItem = getListItemByCheckbox(input)

    input.checked = option.checked

    updateCheckedClass(option, listItem, previousSingleSelectedValue)
    updatePartialCheckedClass(option, listItem)
    updateDisabledCheckedClass(option, listItem)
    updateClosedClass(option, listItem, iconElements)
    updateHiddenClass(option, listItem)

    updateLeftPaddingItems(option, listItem, flattedOptions, rtl)
    updateCheckboxClass(option, input, iconElements)
  })

  updateEmptyListClass(flattedOptions, srcElement)
}

const updateCheckedClass = (
  option: FlattedOptionType,
  listItem: HTMLElement,
  previousSingleSelectedValue: ValueOptionType[]
) => {
  if (option.checked) {
    listItem.classList.add('treeselect-list__item--checked')
  } else {
    listItem.classList.remove('treeselect-list__item--checked')
  }

  if (Array.isArray(previousSingleSelectedValue) && previousSingleSelectedValue[0] === option.id && !option.disabled) {
    listItem.classList.add('treeselect-list__item--single-selected')
  } else {
    listItem.classList.remove('treeselect-list__item--single-selected')
  }
}

const updatePartialCheckedClass = (option: FlattedOptionType, listItem: HTMLElement) => {
  if (option.isPartialChecked) {
    listItem.classList.add('treeselect-list__item--partial-checked')
  } else {
    listItem.classList.remove('treeselect-list__item--partial-checked')
  }
}

const updateDisabledCheckedClass = (option: FlattedOptionType, listItem: HTMLElement) => {
  if (option.disabled) {
    listItem.classList.add('treeselect-list__item--disabled')
  } else {
    listItem.classList.remove('treeselect-list__item--disabled')
  }
}

const updateClosedClass = (option: FlattedOptionType, listItem: HTMLElement, iconElements: IconsType) => {
  if (option.isGroup) {
    const icon = listItem.querySelector('.treeselect-list__item-icon') as HTMLElement
    const iconInnerElement = option.isClosed ? iconElements.arrowRight : iconElements.arrowDown
    appendIconToElement(iconInnerElement, icon)

    if (option.isClosed) {
      listItem.classList.add('treeselect-list__item--closed')
    } else {
      listItem.classList.remove('treeselect-list__item--closed')
    }
  }
}

const updateHiddenClass = (option: FlattedOptionType, listItem: HTMLElement) => {
  if (option.hidden) {
    listItem.classList.add('treeselect-list__item--hidden')
  } else {
    listItem.classList.remove('treeselect-list__item--hidden')
  }
}

const updateCheckboxClass = (option: FlattedOptionType, input: HTMLInputElement, iconElements: IconsType) => {
  const inputContainer = input.parentNode as HTMLElement
  const icon = inputContainer.querySelector('.treeselect-list__item-checkbox-icon') as HTMLElement

  if (option.checked) {
    appendIconToElement(iconElements.check, icon)
  } else if (option.isPartialChecked) {
    appendIconToElement(iconElements.partialCheck, icon)
  } else {
    icon.innerHTML = ''
  }
}

const updateLeftPaddingItems = (
  option: FlattedOptionType,
  listItem: HTMLElement,
  flattedOptions: FlattedOptionType[],
  rtl: boolean
) => {
  const isZeroLevel = option.level === 0
  const defaultPadding = 20
  const zeroLevelItemPadding = 5

  if (isZeroLevel) {
    const isGroupsExistOnLevel = flattedOptions.some((item) => item.isGroup && item.level === option.level)
    const itemPadding = !option.isGroup && isGroupsExistOnLevel ? `${defaultPadding}px` : `${zeroLevelItemPadding}px`
    const padding = option.isGroup ? '0' : itemPadding

    if (rtl) {
      listItem.style.paddingRight = padding
    } else {
      listItem.style.paddingLeft = padding
    }
  } else {
    const padding = option.isGroup
      ? `${option.level * defaultPadding}px`
      : `${option.level * defaultPadding + defaultPadding}px`

    if (rtl) {
      listItem.style.paddingRight = padding
    } else {
      listItem.style.paddingLeft = padding
    }
  }

  // You can use css selectors to reset params with !important
  listItem.setAttribute('level', option.level.toString())
  listItem.setAttribute('group', option.isGroup.toString())
}

const updateEmptyListClass = (flattedOptions: FlattedOptionType[], srcElement: HTMLElement | Element) => {
  const isNotEmpty = flattedOptions.some((option) => !option.hidden)
  const emptyList = srcElement.querySelector('.treeselect-list__empty') as HTMLElement

  if (isNotEmpty) {
    emptyList.classList.add('treeselect-list__empty--hidden')
  } else {
    emptyList.classList.remove('treeselect-list__empty--hidden')
  }
}

const getListItemByCheckbox = (checkbox: HTMLElement | Element) => {
  const checkboxContainer = checkbox.parentNode as HTMLElement
  const listItem = checkboxContainer.parentNode as HTMLElement

  return listItem
}

const getFlattedOptionByInputId = (inputId: string | null, flattedOptions: FlattedOptionType[]) => {
  return flattedOptions.find((fo) => fo.id.toString() === inputId)
}

const getArrowOfItemByCheckbox = (checkbox: HTMLElement | Element) => {
  const item = getListItemByCheckbox(checkbox)
  const arrow = item.querySelector('.treeselect-list__item-icon')

  return arrow
}

//GK
export const setAttributesFromHtmlAttr = (itemElement: HTMLDivElement, htmlAttr?: object) => {
  if (!htmlAttr) {
    return
  }

  Object.keys(htmlAttr).forEach((key) => {
    const value = htmlAttr[key as keyof object]

    if (typeof value === 'string') {
      itemElement.setAttribute(key, value)
    }
  })
}

export class TreeselectList implements ITreeselectList {
  // Props
  options: OptionType[]
  value: ValueOptionType[]
  openLevel: number
  listSlotHtmlComponent: HTMLElement | null
  tagsSortFn: TagsSortFnType
  emptyText: string
  isSingleSelect: boolean
  useTitle: boolean //GK
  showCount: boolean
  disabledBranchNode: boolean
  expandSelected: boolean
  isIndependentNodes: boolean
  rtl: boolean
  listClassName: string
  iconElements: IconsType

  // InnerState
  searchText: string
  flattedOptions: FlattedOptionType[]
  flattedOptionsBeforeSearch: FlattedOptionType[]
  selectedNodes: SelectedNodesType
  srcElement: HTMLElement

  // Callbacks
  inputCallback: (value: SelectedNodesType) => void
  arrowClickCallback: (groupId: ValueOptionType, isClosed: boolean) => void
  mouseupCallback: () => void
  onTagEnterCallback?: (value: ValueOptionType, inList: boolean) => void //GK
  onTagLeaveCallback?: (value: ValueOptionType, inList: boolean) => void //GK

  // PrivateInnerState
  #lastFocusedItem: HTMLElement | null = null
  #isMouseActionsAvailable = true
  #previousSingleSelectedValue: ValueOptionType[] = []
  #isFirstValueUpdate: boolean = true

  constructor({
    options,
    value,
    openLevel,
    listSlotHtmlComponent,
    tagsSortFn,
    emptyText,
    isSingleSelect,
    useTitle, //GK
    iconElements,
    showCount,
    disabledBranchNode,
    expandSelected,
    isIndependentNodes,
    rtl,
    listClassName,
    inputCallback,
    arrowClickCallback,
    mouseupCallback,
    onTagEnterCallback, //GK
    onTagLeaveCallback  //GK
  }: ITreeselectListParams) {
    this.options = options
    this.value = value
    this.openLevel = openLevel ?? 0
    this.listSlotHtmlComponent = listSlotHtmlComponent ?? null
    this.tagsSortFn = tagsSortFn ?? null
    this.emptyText = emptyText ?? 'No results found...'
    this.isSingleSelect = isSingleSelect ?? false
    this.useTitle = useTitle ?? false //GK
    this.showCount = showCount ?? false
    this.disabledBranchNode = disabledBranchNode ?? false
    this.expandSelected = expandSelected ?? false
    this.isIndependentNodes = isIndependentNodes ?? false
    this.rtl = rtl ?? false
    this.listClassName = listClassName ?? ''
    this.iconElements = iconElements

    this.searchText = ''
    this.flattedOptions = getFlattedOptions(this.options, this.openLevel, this.isIndependentNodes)
    this.flattedOptionsBeforeSearch = this.flattedOptions
    this.selectedNodes = { nodes: [], groupedNodes: [], allNodes: [] }
    this.srcElement = this.#createSrcElement()

    this.inputCallback = inputCallback
    this.arrowClickCallback = arrowClickCallback
    this.mouseupCallback = mouseupCallback
    this.onTagEnterCallback = onTagEnterCallback //GK
    this.onTagLeaveCallback = onTagLeaveCallback //GK

    validateOptions(this.flattedOptions)
  }

  // Public methods
  updateValue(value: ValueOptionType[]) {
    this.value = value
    this.#previousSingleSelectedValue = this.isSingleSelect ? this.value : []
    updateListValue(
      value,
      this.flattedOptions,
      this.srcElement,
      this.iconElements,
      this.isSingleSelect,
      this.#previousSingleSelectedValue,
      this.expandSelected,
      this.#isFirstValueUpdate,
      this.isIndependentNodes,
      this.rtl
    )
    this.#isFirstValueUpdate = false
    this.#updateSelectedNodes()
  }

  updateSearchValue(searchText: string) {
    if (searchText === this.searchText) {
      return
    }

    const isStartOfSearching = this.searchText === '' && searchText !== ''
    this.searchText = searchText

    if (isStartOfSearching) {
      this.flattedOptionsBeforeSearch = JSON.parse(JSON.stringify(this.flattedOptions))
    }

    if (this.searchText === '') {
      // This loop need to save a isClose state before searching
      this.flattedOptions = this.flattedOptionsBeforeSearch.map((option) => {
        const newOptionData = this.flattedOptions.find((newOption) => newOption.id === option.id)!
        newOptionData.isClosed = option.isClosed
        newOptionData.hidden = option.hidden

        return newOptionData
      })

      this.flattedOptionsBeforeSearch = []
    }

    if (this.searchText) {
      updateVisibleBySearchFlattedOptions(this.flattedOptions, searchText)
    }

    updateDOM(this.flattedOptions, this.srcElement, this.iconElements, this.#previousSingleSelectedValue, this.rtl)
    this.focusFirstListElement()
  }

  callKeyAction(e: KeyboardEvent) {
    this.#isMouseActionsAvailable = false
    const itemFocused = this.srcElement.querySelector('.treeselect-list__item--focused') as HTMLElement | null
    const isHidden = itemFocused?.classList.contains('treeselect-list__item--hidden')

    if (isHidden) {
      return
    }

    const key = e.key

    if (key === 'Enter' && itemFocused) {
      itemFocused.dispatchEvent(new Event('mousedown'))
    }

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      this.#keyActionsLeftRight(itemFocused, e)
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      this.#keyActionsDownUp(itemFocused, key)
    }
  }

  focusFirstListElement() {
    const focusedClass = 'treeselect-list__item--focused'
    const itemFocused = this.srcElement.querySelector(`.${focusedClass}`)
    const allCheckboxes = Array.from(this.srcElement.querySelectorAll('.treeselect-list__item-checkbox')).filter(
      (checkbox) => window.getComputedStyle(getListItemByCheckbox(checkbox)).display !== 'none'
    )

    if (!allCheckboxes.length) {
      return
    }

    if (itemFocused) {
      itemFocused.classList.remove(focusedClass)
    }

    const firstItem = getListItemByCheckbox(allCheckboxes[0] as HTMLElement)
    firstItem.classList.add(focusedClass)
  }

  isLastFocusedElementExist() {
    return !!this.#lastFocusedItem
  }

  // Private methods
  #keyActionsLeftRight(itemFocused: HTMLElement | null, e: KeyboardEvent) {
    if (!itemFocused) {
      return
    }

    const key = e.key
    const checkbox = itemFocused.querySelector('.treeselect-list__item-checkbox')!
    const inputId = checkbox.getAttribute('input-id')
    const option = getFlattedOptionByInputId(inputId, this.flattedOptions)!
    const arrow = itemFocused.querySelector('.treeselect-list__item-icon')!

    if (key === 'ArrowLeft' && !option.isClosed && option.isGroup) {
      arrow.dispatchEvent(new Event('mousedown'))
      // We use preventDefault to avoid cursor jumping during opening/closing group
      e.preventDefault()
    }

    if (key === 'ArrowRight' && option.isClosed && option.isGroup) {
      arrow.dispatchEvent(new Event('mousedown'))
      // We use preventDefault to avoid cursor jumping during opening/closing group
      e.preventDefault()
    }
  }

  #keyActionsDownUp(itemFocused: HTMLElement | null, key: string) {
    const allCheckboxes = Array.from(this.srcElement.querySelectorAll('.treeselect-list__item-checkbox')).filter(
      (checkbox) => window.getComputedStyle(getListItemByCheckbox(checkbox)).display !== 'none'
    )

    if (!allCheckboxes.length) {
      return
    }

    if (!itemFocused) {
      const firstNode = getListItemByCheckbox(allCheckboxes[0])
      firstNode.classList.add('treeselect-list__item--focused')
    } else {
      const focusedCheckboxIndex = allCheckboxes.findIndex((el) =>
        getListItemByCheckbox(el).classList.contains('treeselect-list__item--focused')
      )
      const focusedNode = getListItemByCheckbox(allCheckboxes[focusedCheckboxIndex])
      focusedNode.classList.remove('treeselect-list__item--focused')

      const nextNodeIndex = key === 'ArrowDown' ? focusedCheckboxIndex + 1 : focusedCheckboxIndex - 1
      const defaultNodeIndex = key === 'ArrowDown' ? 0 : allCheckboxes.length - 1
      const nextCheckbox = allCheckboxes[nextNodeIndex] ?? allCheckboxes[defaultNodeIndex]
      const isDefaultIndex = !allCheckboxes[nextNodeIndex]
      const nextNodeToFocus = getListItemByCheckbox(nextCheckbox)
      nextNodeToFocus.classList.add('treeselect-list__item--focused')

      //GK
      // Trigger tag leave event for the previously focused item
      if (focusedCheckboxIndex !== -1 && this.onTagLeaveCallback) {
        const checkbox = allCheckboxes[focusedCheckboxIndex] as HTMLInputElement
        const optionId = checkbox.getAttribute('input-id')
        if (optionId) {
          // Pass the optionId as is without conversion
          this.onTagLeaveCallback(optionId, true)
        }
      }

      //GK
      // Trigger tag enter event for the newly focused item
      if (this.onTagEnterCallback) {
        const checkbox = nextCheckbox as HTMLInputElement
        const optionId = checkbox.getAttribute('input-id')
        if (optionId) {
          // Pass the optionId as is without conversion
          this.onTagEnterCallback(optionId, true)
        }
      }

      const listCoord = this.srcElement.getBoundingClientRect()
      const nextCoord = nextNodeToFocus.getBoundingClientRect()

      if (isDefaultIndex && key === 'ArrowDown') {
        this.srcElement.scroll(0, 0)

        return
      }

      if (isDefaultIndex && key === 'ArrowUp') {
        this.srcElement.scroll(0, this.srcElement.scrollHeight)

        return
      }

      const slotHeight = this.listSlotHtmlComponent?.clientHeight ?? 0

      if (listCoord.y + listCoord.height < nextCoord.y + nextCoord.height + slotHeight) {
        this.srcElement.scroll(0, this.srcElement.scrollTop + nextCoord.height)

        return
      }

      if (listCoord.y > nextCoord.y) {
        this.srcElement.scroll(0, this.srcElement.scrollTop - nextCoord.height)

        return
      }
    }
  }

  #createSrcElement() {
    const list = this.#createList()
    const listTreeItems = this.#getListHTML(this.options)
    list.append(...listTreeItems)

    const emptyList = this.#createEmptyList()
    list.append(emptyList)

    const slot = this.#createSlot()

    if (slot) {
      list.append(slot)
    }

    return list
  }

  #createList() {
    const list = document.createElement('div')
    list.classList.add('treeselect-list')

    if (this.listClassName.length > 0) {
      list.classList.add(this.listClassName)
    }

    if (this.isSingleSelect) {
      list.classList.add('treeselect-list--single-select')
    }

    if (this.disabledBranchNode) {
      list.classList.add('treeselect-list--disabled-branch-node')
    }

    list.addEventListener('mouseout', (e) => this.#listMouseout(e))
    list.addEventListener('mousemove', () => this.#listMouseMove())
    list.addEventListener('mouseup', () => this.mouseupCallback(), true)

    return list
  }

  #listMouseout(e: Event) {
    e.stopPropagation()

    if (this.#lastFocusedItem && this.#isMouseActionsAvailable) {
      this.#lastFocusedItem.classList.add('treeselect-list__item--focused')
    }
  }

  #listMouseMove() {
    this.#isMouseActionsAvailable = true
  }

  #getListHTML(options: OptionType[]) {
    return options.reduce((acc, option) => {
      if (option.children?.length) {
        const groupContainer = this.#createGroupContainer(option)
        const innerGroupsAndElements = this.#getListHTML(option.children)

        groupContainer.append(...innerGroupsAndElements)
        acc.push(groupContainer)

        return acc
      }

      const itemGroupElement = this.#createGroupItem(option, false)
      acc.push(itemGroupElement)

      return acc
    }, [] as HTMLElement[])
  }

  #createSlot() {
    if (!this.listSlotHtmlComponent) {
      return null
    }

    const slot = document.createElement('div')
    slot.classList.add('treeselect-list__slot')
    slot.appendChild(this.listSlotHtmlComponent)

    return slot
  }

  #createEmptyList() {
    const emptyList = document.createElement('div')
    emptyList.classList.add('treeselect-list__empty')
    if (this.useTitle) { //GK
      emptyList.setAttribute('title', this.emptyText)
    }

    const icon = document.createElement('span')
    icon.classList.add('treeselect-list__empty-icon')
    appendIconToElement(this.iconElements.attention, icon)

    const text = document.createElement('span')
    text.classList.add('treeselect-list__empty-text')
    text.textContent = this.emptyText

    emptyList.append(icon, text)

    return emptyList
  }

  #createGroupContainer(option: OptionType) {
    const groupContainerElement = document.createElement('div')
    groupContainerElement.setAttribute('group-container-id', option.value.toString())
    groupContainerElement.classList.add('treeselect-list__group-container')

    const groupItemElement = this.#createGroupItem(option, true)
    groupContainerElement.appendChild(groupItemElement)

    return groupContainerElement
  }

  #createGroupItem(option: OptionType, isGroup: boolean) {
    const itemElement = this.#createItemElement(option)

    if (isGroup) {
      const arrow = this.#createArrow()
      itemElement.appendChild(arrow)
      itemElement.classList.add('treeselect-list__item--group')
    }

    const checkbox = this.#createCheckbox(option)
    const label = this.#createCheckboxLabel(option, isGroup)
    itemElement.append(checkbox, label)

    return itemElement
  }

  #createItemElement(option: OptionType) {
    const itemElement = document.createElement('div')
    itemElement.setAttribute('tabindex', '-1')
    if (this.useTitle) { //GK
      itemElement.setAttribute('title', option.longName || option.name)
    }
    setAttributesFromHtmlAttr(itemElement, option.htmlAttr)
    itemElement.classList.add('treeselect-list__item')

    itemElement.addEventListener('mouseover', () => this.#itemElementMouseover(itemElement), true)
    itemElement.addEventListener('mouseout', () => this.#itemElementMouseout(itemElement), true)
    itemElement.addEventListener('mousedown', (e) => this.#itemElementMousedown(e, option))

    return itemElement
  }

  #itemElementMouseover(itemElement: HTMLDivElement) {
    if (this.#isMouseActionsAvailable) {
      this.#groupMouseAction(true, itemElement)

      //GK
      // Get the option id from the checkbox input
      const checkbox = itemElement.querySelector('.treeselect-list__item-checkbox') as HTMLInputElement
      if (checkbox && this.onTagEnterCallback) {
        const optionId = checkbox.getAttribute('input-id')
        if (optionId) {
          // Pass the optionId as is without conversion
          this.onTagEnterCallback(optionId, true)
        }
      }
    }
  }

  #itemElementMouseout(itemElement: HTMLDivElement) {
    if (this.#isMouseActionsAvailable) {
      this.#groupMouseAction(false, itemElement)
      this.#lastFocusedItem = itemElement

      //GK
      // Get the option id from the checkbox input
      const checkbox = itemElement.querySelector('.treeselect-list__item-checkbox') as HTMLInputElement
      if (checkbox && this.onTagLeaveCallback) {
        const optionId = checkbox.getAttribute('input-id')
        if (optionId) {
          // Pass the optionId as is without conversion
          this.onTagLeaveCallback(optionId, true)
        }
      }
    }
  }

  #itemElementMousedown(e: Event, option: OptionType) {
    e.preventDefault()
    e.stopPropagation()
    const isDisabled = this.flattedOptions.find((f) => f.id === option.value)?.disabled

    if (isDisabled) {
      return
    }

    const checkbox = (e.target as HTMLElement)?.querySelector('.treeselect-list__item-checkbox') as HTMLInputElement
    checkbox.checked = !checkbox.checked
    this.#checkboxClickEvent(checkbox, option)
  }

  #createArrow() {
    const arrow = document.createElement('span')
    arrow.setAttribute('tabindex', '-1')
    arrow.classList.add('treeselect-list__item-icon')
    appendIconToElement(this.iconElements.arrowDown, arrow)

    arrow.addEventListener('mousedown', (e) => this.#arrowMousedown(e))

    return arrow
  }

  #arrowMousedown(e: Event) {
    e.preventDefault()
    e.stopPropagation()
    this.#arrowClickEvent(e)
  }

  #createCheckbox(option: OptionType) {
    const checkboxContainer = document.createElement('div')
    checkboxContainer.classList.add('treeselect-list__item-checkbox-container')
    const ico = document.createElement('span')
    ico.classList.add('treeselect-list__item-checkbox-icon')
    ico.innerHTML = ''

    const checkbox = document.createElement('input')
    checkbox.setAttribute('tabindex', '-1')
    checkbox.setAttribute('type', `checkbox`)
    checkbox.setAttribute('input-id', option.value.toString())
    checkbox.classList.add('treeselect-list__item-checkbox')

    checkboxContainer.append(ico, checkbox)

    return checkboxContainer
  }

  #createCheckboxLabel(option: OptionType, isGroup: boolean) {
    const label = document.createElement('label')
    label.textContent = option.longName || option.name
    label.classList.add('treeselect-list__item-label')
    if (this.useTitle) { //GK
      label.setAttribute('title', option.longName || option.name)
    }
    if (isGroup && this.showCount) {
      const counter = this.#createCounter(option)
      label.appendChild(counter)
    }

    return label
  }

  #createCounter(option: OptionType) {
    const counter = document.createElement('span')
    const children = this.flattedOptions.filter((fo) => fo.childOf === option.value)
    counter.textContent = `(${children.length})`
    counter.classList.add('treeselect-list__item-label-counter')

    return counter
  }

  // Actions
  #checkboxClickEvent(target: HTMLInputElement, option: OptionType) {
    const flattedOption = this.flattedOptions.find((fo) => fo.id === option.value)
    if (!flattedOption) {
      return
    }

    if (flattedOption?.isGroup && this.disabledBranchNode) {
      // We need to close/open disabled group on mousedown
      const arrow = getArrowOfItemByCheckbox(target)
      arrow?.dispatchEvent(new Event('mousedown'))

      return
    }

    // Don't proceed if we're trying to uncheck something
    if (!target.checked) {
      flattedOption.checked = false
      updateOptionByCheckState(flattedOption, this.flattedOptions, this.isIndependentNodes)
      updateDOM(this.flattedOptions, this.srcElement, this.iconElements, this.#previousSingleSelectedValue, this.rtl)
      this.#emitInput()
      return
    }

    // Handle global isSingleSelect setting first
    if (this.isSingleSelect) {
      const [previousValue] = this.#previousSingleSelectedValue

      // Prevent emitting the same value
      if (flattedOption.id === previousValue) {
        return
      }

      this.#previousSingleSelectedValue = [flattedOption.id]
      updateOptionsByValue([flattedOption.id], this.flattedOptions, this.isSingleSelect, this.isIndependentNodes)
      updateDOM(this.flattedOptions, this.srcElement, this.iconElements, this.#previousSingleSelectedValue, this.rtl)
      this.#emitInput()
      return
    }

    // If independent nodes mode is on, we don't need to do any of the single select logic
    if (this.isIndependentNodes) {
      // Simply check/uncheck the current option and emit input event
      flattedOption.checked = true
      const resultChecked = updateOptionByCheckState(flattedOption, this.flattedOptions, this.isIndependentNodes)
      target.checked = resultChecked
      updateDOM(this.flattedOptions, this.srcElement, this.iconElements, this.#previousSingleSelectedValue, this.rtl)
      this.#emitInput()
      return
    }

    // We're in multi-select mode but checking a node, so handle per-node isSingleSelect

    // Build a path from the current node to the root to identify ancestors and descendants to preserve
    const pathToRoot = new Set<ValueOptionType>()
    let currentNode = flattedOption
    while (currentNode) {
      pathToRoot.add(currentNode.id)
      if (currentNode.childOf) {
        const parent = this.flattedOptions.find(fo => fo.id === currentNode.childOf)
        if (parent) {
          currentNode = parent
        } else {
          break
        }
      } else {
        break
      }
    }

    // Check all ancestors for isSingleSelect
    const ancestors = []
    currentNode = flattedOption
    while (currentNode?.childOf) {
      const parent = this.flattedOptions.find(fo => fo.id === currentNode.childOf)
      if (parent) {
        ancestors.push(parent)
        currentNode = parent
      } else {
        break
      }
    }

    // For each ancestor with isSingleSelect, uncheck all other descendants
    ancestors.forEach(ancestor => {
      if (ancestor.isSingleSelect) {
        // Find all descendants of this ancestor
        const findDescendants = (node: FlattedOptionType): FlattedOptionType[] => {
          const result: FlattedOptionType[] = []
          const children = this.flattedOptions.filter(fo => fo.childOf === node.id)
          result.push(...children)
          children.forEach(child => {
            result.push(...findDescendants(child))
          })
          return result
        }

        const allDescendants = findDescendants(ancestor)

        // Uncheck all descendants not in the path to the current node
        allDescendants.forEach(descendant => {
          if (!pathToRoot.has(descendant.id) && descendant.checked) {
            descendant.checked = false
            descendant.isPartialChecked = false
          }
        })
      }
    })

    // Handle current node's isSingleSelect if it's a group
    if (flattedOption.isSingleSelect && flattedOption.isGroup) {
      // Uncheck all currently checked descendants
      const findDescendants = (node: FlattedOptionType): FlattedOptionType[] => {
        const result: FlattedOptionType[] = []
        const children = this.flattedOptions.filter(fo => fo.childOf === node.id)
        result.push(...children)
        children.forEach(child => {
          result.push(...findDescendants(child))
        })
        return result
      }

      const descendants = findDescendants(flattedOption)
      descendants.forEach(descendant => {
        if (descendant.checked) {
          descendant.checked = false
          descendant.isPartialChecked = false
        }
      })
    }

    // Finally, check the current option
    flattedOption.checked = true
    const resultChecked = updateOptionByCheckState(flattedOption, this.flattedOptions, this.isIndependentNodes)
    target.checked = resultChecked

    // Force update all ancestor states to fix any inconsistent partial checked states
    forceUpdateAllAncestorStates(this.flattedOptions)

    // Update the DOM and emit input event
    updateDOM(this.flattedOptions, this.srcElement, this.iconElements, this.#previousSingleSelectedValue, this.rtl)
    this.#emitInput()
  }

  #arrowClickEvent(e: Event) {
    const input = (e.target as HTMLElement)?.parentNode?.querySelector('[input-id]')
    const inputId = input?.getAttribute('input-id') ?? null
    const flattedOption = getFlattedOptionByInputId(inputId, this.flattedOptions)

    if (flattedOption) {
      flattedOption.isClosed = !flattedOption.isClosed
      hideShowChildrenOptions(this.flattedOptions, flattedOption)
      updateDOM(this.flattedOptions, this.srcElement, this.iconElements, this.#previousSingleSelectedValue, this.rtl)

      this.arrowClickCallback(flattedOption.id, flattedOption.isClosed)
    }
  }

  #groupMouseAction(isMouseOver: boolean, itemElement: HTMLElement) {
    const focusedClassName = 'treeselect-list__item--focused'

    if (isMouseOver) {
      const itemsFocused = Array.from(this.srcElement.querySelectorAll(`.${focusedClassName}`))

      if (itemsFocused.length) {
        itemsFocused.forEach((el) => el.classList.remove(focusedClassName))
      }

      itemElement.classList.add(focusedClassName)
    } else {
      itemElement.classList.remove(focusedClassName)
    }
  }

  #sortNodes(nodes: FlattedOptionType[]) {
    return this.tagsSortFn === null
      ? nodes
      : [...nodes].sort((a, b) => this.tagsSortFn!({ value: a.id, name: a.name }, { value: b.id, name: b.name }))
  }

  #updateSelectedNodes() {
    const { ungroupedNodes, groupedNodes, allNodes } = getCheckedOptions(this.flattedOptions)

    this.selectedNodes = {
      nodes: this.#sortNodes(ungroupedNodes),
      groupedNodes: this.#sortNodes(groupedNodes),
      allNodes: this.#sortNodes(allNodes)
    }
  }

  // Emits
  #emitInput() {
    this.#updateSelectedNodes()
    this.inputCallback(this.selectedNodes)
    this.value = this.selectedNodes.nodes.map((node) => node.id)
  }
}
