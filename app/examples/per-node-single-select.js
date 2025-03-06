const options = [
  {
    name: 'England',
    value: 1,
    isSingleSelect: true, // Only one child of England can be selected at a time
    children: [
      {
        name: 'London',
        value: 'Text 2',
        children: [
          {
            name: 'Chelsea',
            value: 3,
            children: []
          },
          {
            name: 'West End',
            longName: 'London\'s Wonderful West End',
            value: 'Text 4',
            children: []
          }
        ]
      },
      {
        name: 'Brighton',
        value: 5,
        children: []
      }
    ]
  },
  {
    name: 'France',
    value: 'Text 6',
    isSingleSelect: true, // Only one child of France can be selected at a time
    children: [
      {
        name: 'Paris',
        value: 7,
        children: []
      },
      {
        name: 'Lyon',
        value: 8,
        children: []
      }
    ]
  }
]

const className = '.treeselect-demo-per-node-single-select'

export const runPerNodeSingleSelectExample = (Treeselect) => {
  const domElement = document.querySelector(className)
  const treeselect = new Treeselect({
    parentHtmlContainer: domElement,
    value: [3, 7], // Select one item in each branch
    options: options,
    // disabledBranchNode: true,
    // Not setting global isSingleSelect here, since we want to allow selecting from multiple top-level branches
    onTagEnter: (value, inList) => {
      console.log('per-node-single-select: onTagEnter ', value, inList)
    },
    onTagLeave: (value, inList) => {
      console.log('per-node-single-select: onTagLeave ', value, inList)
    }
  })

  treeselect.srcElement.addEventListener('input', (e) => {
    console.log('per-node-single-select: Selected value ', e.detail)
  })
}
