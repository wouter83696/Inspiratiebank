/* The same select controls in public views and management forms. */
(function(){
  function customSelectChoiceIcon(type='', value=''){
    const raw = String(value || '');
    const normalized = normalize(raw);
    if(type === 'cost'){
      const label = normalizeIdeaCost(raw);
      const iconClass = label === 'Gratis' ? 'costFree' : label === '€€€' ? 'costHigh' : label === '€€' ? 'costMid' : 'costLow';
      return `<span class="choiceIcon ${iconClass}" aria-hidden="true">${label === 'Gratis' ? '€' : escapeHtml(label)}</span>`;
    }
    if(type === 'stimulus'){
      const label = normalizeIdeaStimulus(raw);
      const lines = label === 'Hoog' ? 3 : label === 'Middel' ? 2 : 1;
      const iconClass = label === 'Hoog' ? 'stimulusHigh' : label === 'Middel' ? 'stimulusMedium' : 'stimulusLow';
      const yPositions = lines === 1 ? [9] : lines === 2 ? [6,12] : [4,9,14];
      const paths = Array.from({length:lines}, (_, index) => {
        const y = yPositions[index];
        return `<path d="M1.5 ${y}c2.9-2.7 5.8 2.7 8.7 0S17.6 ${y - 2.7} 20.5 ${y}"></path>`;
      }).join('');
      return `<span class="choiceIcon ${iconClass}" aria-hidden="true"><svg viewBox="0 0 22 18">${paths}</svg></span>`;
    }
    if(normalized) return '';
    return '';
  }
  function enhanceCustomSelect(select){
    if(!select) return;
    const previous = select.closest('.customSelect');
    if(previous){
      previous.parentNode.insertBefore(select, previous);
      previous.remove();
    }
    select.classList.add('customNativeSelect');
    const themed = select.dataset.themeSelect === 'true';
    const choiceType = select.dataset.choiceSelect || '';
    const control = document.createElement('div');
    control.className = themed ? 'customSelect themeSelect' : choiceType ? 'customSelect choiceSelect' : 'customSelect';
    control.dataset.selectId = select.id || '';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'customSelectButton';
    button.setAttribute('aria-haspopup','listbox');
    button.setAttribute('aria-expanded','false');
    const icon = document.createElement('span');
    icon.className = 'domainIcon';
    icon.setAttribute('aria-hidden','true');
    const choiceIcon = document.createElement('span');
    choiceIcon.className = 'choiceIconSlot';
    choiceIcon.setAttribute('aria-hidden','true');
    const label = document.createElement('span');
    label.className = 'customSelectLabel';
    if(themed) button.appendChild(icon);
    if(choiceType) button.appendChild(choiceIcon);
    button.appendChild(label);
    const menu = document.createElement('div');
    menu.className = 'customSelectMenu';
    menu.setAttribute('role','listbox');
    [...select.options].forEach(option => {
      if((option.value === 'all' || option.value === '') && select.dataset.includePlaceholderOption !== 'true') return;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'customSelectOption';
      item.dataset.value = option.value;
      item.setAttribute('role','option');
      if(themed){
        item.classList.add(domainThemeClass(option.value));
        const itemIcon = document.createElement('span');
        itemIcon.className = 'domainIcon';
        itemIcon.setAttribute('aria-hidden','true');
        itemIcon.innerHTML = domainIcon(option.value);
        const itemLabel = document.createElement('span');
        itemLabel.textContent = option.textContent;
        item.append(itemIcon, itemLabel);
      }else if(choiceType){
        const itemIconWrap = document.createElement('span');
        itemIconWrap.innerHTML = customSelectChoiceIcon(choiceType, option.value);
        const itemIcon = itemIconWrap.firstElementChild;
        const itemLabel = document.createElement('span');
        itemLabel.textContent = option.textContent;
        if(itemIcon) item.append(itemIcon);
        item.append(itemLabel);
      }else{
        item.textContent = option.textContent;
      }
      item.addEventListener('click', () => {
        select.value = option.value;
        select._syncCustomSelect();
        select.dispatchEvent(new Event('input',{bubbles:true}));
        select.dispatchEvent(new Event('change',{bubbles:true}));
        closeCustomSelects();
      });
      menu.appendChild(item);
    });
    select.parentNode.insertBefore(control, select);
    control.append(select, button, menu);
    select._syncCustomSelect = () => {
      const selected = select.options[select.selectedIndex] || select.options[0];
      const isPlaceholder = !selected || selected.value === '' || selected.value === 'all';
      label.textContent = selected ? selected.textContent : '';
      if(themed){
        control.classList.remove('themeCreative','themeCulture','themeNature','themeSocial','themeSport','themeAction','themeDefault');
        control.classList.toggle('placeholder', isPlaceholder);
      }
      if(themed && selected && !isPlaceholder){
        control.classList.add(domainThemeClass(selected.value));
        icon.innerHTML = domainIcon(selected.value);
      }else if(themed){
        icon.innerHTML = '';
      }
      if(choiceType){
        choiceIcon.innerHTML = customSelectChoiceIcon(choiceType, selected ? selected.value : '');
      }
      menu.querySelectorAll('.customSelectOption').forEach(item => {
        const active = item.dataset.value === select.value;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    };
    select._syncCustomSelect();
    button.addEventListener('click', () => {
      const willOpen = !control.classList.contains('open');
      closeCustomSelects(control);
      control.classList.toggle('open', willOpen);
      button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      control.classList.remove('openUp');
      if(willOpen){
        if(control.closest('.agendaWeekFilterSlot')) return;
        const buttonRect = button.getBoundingClientRect();
        const menuHeight = Math.min(menu.scrollHeight || 0, 280);
        const modalCard = control.closest('.ideaModalCard');
        const clipsToCard = modalCard && getComputedStyle(modalCard).overflow !== 'visible';
        const modalBottom = clipsToCard ? modalCard.getBoundingClientRect().bottom : window.innerHeight;
        const lowerBoundary = Math.min(window.innerHeight, modalBottom);
        const spaceBelow = lowerBoundary - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        control.classList.toggle('openUp', spaceBelow < menuHeight + 18 && spaceAbove > spaceBelow);
      }
    });
  }

window.SelectViewShared=Object.freeze({enhanceCustomSelect});
})();
