import Utils from '../ui-utils';
import Events from '../ui-events';

export default class DropDown {

  viewNode: HTMLElement;
  randomID: string;
  optionsState: boolean = false;
  toggleBinded: EventListener = this.toggleDropDown.bind(this);
  closeDropDownBinded: EventListener = this.closeDropDown.bind(this);

  constructor(
      private items,
      private activeItem,
      private isDisabled: boolean,
      private onSelectItem: Function) {
    this.randomID = Utils.guidGenerator();
    this.viewNode = Utils.getElementFromHtml(`<div id="leonardo-dropdown-${this.randomID}" class="leonardo-dropdown"></div>`);
    document.body.addEventListener('click', this.closeDropDownBinded, false);
    Events.on(Events.CLOSE_DROPDOWNS, this.closeDropDownBinded);
  }

  get() {
    return this.viewNode;
  }

  render() {
    this.viewNode.removeEventListener('click', this.toggleBinded, false);
    this.viewNode.innerHTML = `
          <div class="leonardo-dropdown-selected" ${this.isDisabledToken()}>
            <span class="leonardo-dropdown-selected-text">${this.activeItem.name}</span>
            <span class="leonardo-dropdown-selected-arrow">></span>
          </div>
          <div class="leonardo-dropdown-options">
            <ul class="leonardo-dropdown-list">${this.getItems().join('')}</ul>
          </div>`;
    this.viewNode.addEventListener('click', this.toggleBinded, false);
  }

  disableDropDown() {
    this.isDisabled = true;
    this.viewNode.querySelector(`.leonardo-dropdown-selected`).setAttribute('disabled', 'disabled');
  }

  enableDropDown() {
    this.isDisabled = false;
    this.viewNode.querySelector(`.leonardo-dropdown-selected`).removeAttribute('disabled');
  }

  toggleDropDown(event: MouseEvent) {
    if (this.isDisabled) {
      return;
    }
    if (event && event.target) {
      event.stopPropagation();
    }
    if(event.target['classList'].contains('leonardo-dropdown-item-text')){
      this.setActiveItem(event.target['innerHTML']);
    }
    if(event.target['classList'].contains('leonardo-dropdown-item-x')){
      this.removeItem(<HTMLElement>event.target['parentNode']);
    }
    if (this.optionsState) {
      this.closeDropDown();
      this.optionsState = false;
    }
    else {
      this.openDropDown();
      this.optionsState = true;
    }
  }

  openDropDown() {
    this.viewNode.querySelector(`.leonardo-dropdown-options`)['style'].display = 'block';
    Events.dispatch(Events.CLOSE_DROPDOWNS, this.viewNode);
  }

  closeDropDown(event?: CustomEvent) {
    if (event && event.detail === this.viewNode) {
      return;
    }
    this.viewNode.querySelector(`.leonardo-dropdown-options`)['style'].display = 'none';
  }

  private setActiveItem(itemName: string){
    if(this.activeItem.name === itemName){
      return;
    }
    this.activeItem = this.getItemByName(itemName);
    this.viewNode.querySelector(`.leonardo-dropdown-selected-text`)['innerHTML'] = this.activeItem.name;
    this.onSelectItem(this.activeItem);
  }

  private getItemByName(itemName: string) {
    let retItem = this.activeItem;
    this.items.some((curItem) => {
      if(curItem.name === itemName){
        retItem = curItem;
        return true;
      }
    });
    return retItem;
  }

  private getItems() {
    return this.items.map((item: {name: string}) => {
      return `<li class="leonardo-dropdown-item"><span class="leonardo-dropdown-item-text">${item.name}</span><span class="leonardo-dropdown-item-x">X</span></li>`
    })
  }

  private isDisabledToken() {
    return this.isDisabled ? 'disabled' : '';
  }
  
  private removeItem(item: HTMLElement) {
    if(this.items.length <= 1){
      return;
    }
    this.items = this.items.filter((item) => {
      return item.name === item.innerHTML;
    });
    this.viewNode.querySelector('.leonardo-dropdown-list').removeChild(item);
  }

  private onDestroy(){
    document.body.removeEventListener('click', this.closeDropDownBinded, false);
    this.viewNode.removeEventListener('click', this.toggleBinded, false);
  }
}