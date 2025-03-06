import { ValueOptionType, FlattedOptionType } from '../../treeselectTypes'
import { getChildrenOptions } from './listOptionsHelper'

// Helper function to build ancestor paths for a node
const buildAncestorPaths = (option: FlattedOptionType, flattedOptions: FlattedOptionType[]) => {
  const ancestorPaths: Array<{
    ancestorId: ValueOptionType;
    isSingleSelect: boolean;
  }> = [];
  
  let current = option;
  while (current && current.childOf) {
    const parent = flattedOptions.find(opt => opt.id === current.childOf);
    if (parent) {
      ancestorPaths.push({
        ancestorId: parent.id,
        isSingleSelect: !!parent.isSingleSelect
      });
      current = parent;
    } else {
      break;
    }
  }
  
  return ancestorPaths;
};

export const updateOptionsByValue = (
  newValue: ValueOptionType[],
  flattedOptions: FlattedOptionType[],
  isSingleSelect: boolean,
  isIndependentNodes: boolean
) => {
  // First, uncheck all options
  uncheckedAllFlattedOptions(flattedOptions)
  
  // Global single select mode - just check the first option and return
  if (isSingleSelect && newValue.length > 0) {
    const optionToCheck = flattedOptions.find(o => o.id === newValue[0] && !o.disabled);
    if (optionToCheck) {
      optionToCheck.checked = true;
    }
    return;
  }
  
  // Handle independent nodes mode - directly check options without parent/child logic
  if (isIndependentNodes) {
    for (const id of newValue) {
      const option = flattedOptions.find(o => o.id === id && !o.disabled);
      if (option) {
        option.checked = true;
      }
    }
    return;
  }
  
  // Build a map of all ancestors with isSingleSelect
  const singleSelectAncestors = new Map<ValueOptionType, Set<ValueOptionType>>();
  
  // First pass: build a map of all single-select ancestors and the nodes they allow
  for (const id of newValue) {
    const option = flattedOptions.find(o => o.id === id && !o.disabled);
    if (!option) continue;
    
    // For each ancestor with isSingleSelect, add this option's path to the allowed paths
    const ancestorPaths = buildAncestorPaths(option, flattedOptions);
    
    for (const { ancestorId, isSingleSelect } of ancestorPaths) {
      if (isSingleSelect) {
        // If we haven't seen this ancestor yet, create a new set
        if (!singleSelectAncestors.has(ancestorId)) {
          singleSelectAncestors.set(ancestorId, new Set<ValueOptionType>());
        }
        
        // Add this option to the ancestor's allowed nodes
        const ancestorSet = singleSelectAncestors.get(ancestorId);
        if (ancestorSet) {
          ancestorSet.add(id);
        }
      }
    }
  }
  
  // For each ancestor with isSingleSelect, determine which descendant to keep
  // and which ones to remove from newValue
  const valuesToRemove = new Set<ValueOptionType>();
  
  singleSelectAncestors.forEach((allowedValues) => {
    // If multiple values are allowed under this ancestor, we need to pick one
    if (allowedValues.size > 1) {
      // Convert Set to Array so we can get the first element
      const allowedValuesArray = Array.from(allowedValues);
      // Keep the first value, remove the rest
      for (let i = 1; i < allowedValuesArray.length; i++) {
        valuesToRemove.add(allowedValuesArray[i]);
      }
    }
  });
  
  // Filter out removed values from newValue
  const filteredValues = newValue.filter(id => !valuesToRemove.has(id));
  
  // Now check each remaining value
  for (const id of filteredValues) {
    const option = flattedOptions.find(o => o.id === id && !o.disabled);
    if (option) {
      option.checked = true;
    }
  }
  
  // Apply the checks to update parent and child states
  flattedOptions.forEach(option => {
    if (option.checked) {
      updateOptionByCheckState(option, flattedOptions, isIndependentNodes);
    }
  });
  
  // Force update the partial checked states of all nodes to ensure UI consistency
  forceUpdateAllAncestorStates(flattedOptions);
}

// Helper function to find all ancestors of a node
const findAllAncestors = (option: FlattedOptionType, flattedOptions: FlattedOptionType[]): FlattedOptionType[] => {
  const ancestors: FlattedOptionType[] = [];
  let current = option;
  
  while (current?.childOf) {
    const parent = flattedOptions.find(opt => opt.id === current.childOf);
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
    }
  }
  
  return ancestors;
};

// Helper function to find all descendants of a node
const findAllDescendants = (option: FlattedOptionType, flattedOptions: FlattedOptionType[]): FlattedOptionType[] => {
  const descendants: FlattedOptionType[] = [];
  
  // Direct children
  const children = flattedOptions.filter(opt => opt.childOf === option.id);
  descendants.push(...children);
  
  // Recursively add children's descendants
  children.forEach(child => {
    descendants.push(...findAllDescendants(child, flattedOptions));
  });
  
  return descendants;
};

export const updateOptionByCheckState = (
  { id, checked }: Partial<FlattedOptionType>,
  flattedOptions: FlattedOptionType[],
  isIndependentNodes: boolean
) => {
  const currentOption = flattedOptions.find((option) => option.id === id)

  if (!currentOption) {
    return false
  }

  if (isIndependentNodes) {
    currentOption.checked = currentOption.disabled ? false : !!checked
    // When isIndependentNodes is true, we don't touch any other nodes
    // No need to handle single select logic, update children, or update parent states
    return currentOption.checked
  }
  
  // If we're checking this option
  if (currentOption.checked !== !!checked && !!checked) {
    // Find all ancestors with isSingleSelect
    const ancestors = findAllAncestors(currentOption, flattedOptions);
    for (const ancestor of ancestors) {
      if (ancestor.isSingleSelect) {
        // Find all descendants of this ancestor, excluding the current option's branch
        const allDescendants = findAllDescendants(ancestor, flattedOptions);
        
        // Find the path from the ancestor to the current option
        const pathToCurrentOption: Set<ValueOptionType> = new Set();
        let node = currentOption;
        while (node && node.id !== ancestor.id) {
          pathToCurrentOption.add(node.id);
          const parent = flattedOptions.find(opt => opt.id === node.childOf);
          if (parent) {
            node = parent;
          } else {
            break;
          }
        }
        
        // Uncheck all descendants that aren't in the path to the current option
        allDescendants.forEach(descendant => {
          if (!pathToCurrentOption.has(descendant.id) && descendant.checked) {
            descendant.checked = false;
            descendant.isPartialChecked = false;
          }
        });
      }
    }
    
    // Check if the parent node has isSingleSelect set (handling immediate parent)
    const parentNode = flattedOptions.find(option => option.id === currentOption.childOf);
    if (parentNode?.isSingleSelect) {
      // Get all siblings and their descendants
      const siblings = flattedOptions.filter(option => 
        option.childOf === parentNode.id && 
        option.id !== currentOption.id
      );
      
      // Uncheck all siblings and their descendants
      siblings.forEach(sibling => {
        sibling.checked = false;
        sibling.isPartialChecked = false;
        
        const descendants = findAllDescendants(sibling, flattedOptions);
        descendants.forEach(descendant => {
          descendant.checked = false;
          descendant.isPartialChecked = false;
        });
      });
    }
    
    // If the current node itself has isSingleSelect, ensure any previously checked children are unchecked
    if (currentOption.isSingleSelect) {
      const descendants = findAllDescendants(currentOption, flattedOptions);
      descendants.forEach(descendant => {
        if (descendant.checked) {
          descendant.checked = false;
          descendant.isPartialChecked = false;
        }
      });
    }
    
    // After unchecking nodes, make sure to update the partial checked states of all ancestors
    // to fix the issue where London still shows partial checked when Brighton is selected
    forceUpdateAllAncestorStates(flattedOptions);
  }

  const resultCheckedState = updateFlattedOptionStateWithChildren(!!checked, currentOption, flattedOptions)
  updateParentFlattedOptions(currentOption, flattedOptions)

  return resultCheckedState
}

const updateFlattedOptionStateWithChildren = (
  checked: boolean,
  currentOption: FlattedOptionType,
  flattedOptions: FlattedOptionType[]
) => {
  if (!currentOption.isGroup) {
    currentOption.checked = currentOption.disabled ? false : !!checked
    currentOption.isPartialChecked = false

    return currentOption.checked
  }

  const childrenOptions = flattedOptions.filter((option) => option.childOf === currentOption.id)
  const falseOrDisabledOrPartial = !checked || currentOption.disabled || currentOption.isPartialChecked

  if (falseOrDisabledOrPartial) {
    currentOption.checked = false
    currentOption.isPartialChecked = false
    checkUncheckAllChildren(currentOption, childrenOptions, flattedOptions)

    return currentOption.checked
  }

  const canWeCheckAllChildren = !isSomeChildrenDisabled(childrenOptions, flattedOptions)

  if (canWeCheckAllChildren) {
    currentOption.checked = true
    currentOption.isPartialChecked = false
    checkUncheckAllChildren(currentOption, childrenOptions, flattedOptions)

    return currentOption.checked
  }

  const isAllDisabled = isAllChildrenDisabled(childrenOptions)

  if (isAllDisabled) {
    currentOption.checked = false
    currentOption.isPartialChecked = false
    currentOption.disabled = true

    return currentOption.checked
  }

  currentOption.checked = false
  currentOption.isPartialChecked = true

  childrenOptions.forEach((option) => {
    updateFlattedOptionStateWithChildren(checked, option, flattedOptions)
  })

  return currentOption.checked
}

const updateParentFlattedOptions = (childNode: FlattedOptionType, flattedOptions: FlattedOptionType[]) => {
  const parentOption = flattedOptions.find((option) => option.id === childNode.childOf)

  if (!parentOption) {
    return
  }

  updateParentOption(parentOption, flattedOptions)
  updateParentFlattedOptions(parentOption, flattedOptions)
}

const updateParentOption = (parentOption: FlattedOptionType, flattedOptions: FlattedOptionType[]) => {
  const children = getChildrenOptions(parentOption, flattedOptions)
  const isAllDisabled = isAllChildrenDisabled(children)

  if (isAllDisabled) {
    parentOption.checked = false
    parentOption.isPartialChecked = false
    parentOption.disabled = true

    return
  }

  const isAllChecked = isAllChildrenChecked(children)

  if (isAllChecked) {
    parentOption.checked = true
    parentOption.isPartialChecked = false

    return
  }

  const isSomeCheckedOrPartial = isSomeChildrenCheckedOrPartial(children)

  if (isSomeCheckedOrPartial) {
    parentOption.checked = false
    parentOption.isPartialChecked = true

    return
  }

  parentOption.checked = false
  parentOption.isPartialChecked = false
}

const checkUncheckAllChildren = (
  { checked, disabled }: Partial<FlattedOptionType>,
  children: FlattedOptionType[],
  flattedOptions: FlattedOptionType[]
) => {
  children.forEach((option) => {
    option.disabled = !!disabled || !!option.disabled
    option.checked = !!checked && !option.disabled
    option.isPartialChecked = false
    const subChildren = getChildrenOptions(option, flattedOptions)
    checkUncheckAllChildren({ checked, disabled }, subChildren, flattedOptions)
  })
}

const isSomeChildrenDisabled = (children: FlattedOptionType[], flattedOptions: FlattedOptionType[]) => {
  const isSomeDisabled = children.some((option) => option.disabled)

  if (isSomeDisabled) {
    return true
  }

  const isSomeSubChildrenDisabled = children.some((option) => {
    if (option.isGroup) {
      const subChildren = getChildrenOptions(option, flattedOptions)

      return isSomeChildrenDisabled(subChildren, flattedOptions)
    }

    return false
  })

  return isSomeSubChildrenDisabled
}

const isAllChildrenDisabled = (children: FlattedOptionType[]) => {
  return children.every((option) => !!option.disabled)
}

const isAllChildrenChecked = (children: FlattedOptionType[]) => {
  return children.every((option) => !!option.checked)
}

const isSomeChildrenCheckedOrPartial = (children: FlattedOptionType[]) => {
  return children.some((option) => !!option.checked || !!option.isPartialChecked)
}

// Function to force update the checked and partialChecked states of all nodes
// This is needed to fix issues where parent partial checked states don't update correctly
// when enforcing single-select
export const forceUpdateAllAncestorStates = (flattedOptions: FlattedOptionType[]) => {
  // Get all group nodes
  const groupNodes = flattedOptions.filter(option => option.isGroup);
  
  // Process each node from bottom up to ensure correct parent-child state propagation
  // First, sort nodes by depth (deepest first)
  const nodesByDepth = new Map<number, FlattedOptionType[]>();
  
  groupNodes.forEach(node => {
    // Calculate node depth
    let depth = 0;
    let current = node;
    
    while (current && current.childOf) {
      depth++;
      const parent = flattedOptions.find(o => o.id === current.childOf);
      if (parent) {
        current = parent;
      } else {
        break;
      }
    }
    
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    const depthArray = nodesByDepth.get(depth);
    if (depthArray) {
      depthArray.push(node);
    }
  });
  
  // Process from deepest to shallowest
  const depths = Array.from(nodesByDepth.keys()).sort((a, b) => b - a);
  for (const depth of depths) {
    const nodesAtDepth = nodesByDepth.get(depth);
    if (nodesAtDepth) {
      nodesAtDepth.forEach(node => {
        // Get all children of this node
        const children = flattedOptions.filter(option => option.childOf === node.id);
        
        // Update node state based on children
        if (children.length > 0) {
          const allChecked = children.every(child => child.checked);
          const someCheckedOrPartial = children.some(child => child.checked || child.isPartialChecked);
          
          if (allChecked) {
            node.checked = true;
            node.isPartialChecked = false;
          } else if (someCheckedOrPartial) {
            node.checked = false;
            node.isPartialChecked = true;
          } else {
            node.checked = false;
            node.isPartialChecked = false;
          }
        }
      });
    }
  }
}

const uncheckedAllFlattedOptions = (flattedOptions: FlattedOptionType[]) => {
  flattedOptions.forEach((option) => {
    option.checked = false
    option.isPartialChecked = false
  })
}
