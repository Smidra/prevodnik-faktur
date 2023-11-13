
//... your script logic goes here

document.getElementById('my-dropdown').addEventListener('cds-dropdown-selected', (evt) => {
    console.log("SELECTED ITEM: ", evt.detail.item.value);
})
