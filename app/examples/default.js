const options = [
  {
    name: 'England',
    value: 1,
    children: [
      {
        name: 'London',
        value: 'Text 2',
        children: [
          {
            name: 'Chelsea',
            value: 3,
            children: [],
            htmlAttr: { title: 'Useless', style: 'color:red;' } //GK
          },
          {
            name: 'West End',
            longName: 'London\'s Wonderful West End', //GK
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

const className = '.treeselect-demo-default'

export const runDefaultExample = (Treeselect) => {
  const domElement = document.querySelector(className)
  const treeselect = new Treeselect({
    parentHtmlContainer: domElement,
    value: [4, 7, 8],
    options: options,
    onTagEnter: (value, inList) => {
      console.log('default: onTagEnter ', value, inList)
    },
    onTagLeave: (value, inList) => {
      console.log('default: onTagLeave ', value, inList)
    }
  })

  treeselect.srcElement.addEventListener('input', (e) => {
    console.log('default: Selected value ', e.detail)
  })
}
