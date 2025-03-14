import {HttpUtils} from "../utils/http-utils";

interface UserInfo {
    name: string;
}

export class Layout {
    constructor() {
        this.setUserName();
        this.rotateArrow();
        this.getBalanceUser().then();
        this.balanceBtnFunction();
        this.buttonsControl();
    }

    balanceBtnFunction(): void {
        const balanceBtn = document.getElementById('btn-balance-save') as HTMLButtonElement | null;
        if (!balanceBtn) return;

        balanceBtn.addEventListener('click', () => {
            const balanceInput = document.getElementById('balance-input');
            if (!(balanceInput instanceof HTMLInputElement)) return;

            const newBalance = balanceInput.value.trim() !== '' ? parseFloat(balanceInput.value) : 0;
            this.setBalanceUser(newBalance).then();
        });
    }

    async setBalanceUser(newBalance: number): Promise<boolean> {
        const result = await HttpUtils.request('/balance', 'PUT', true, {newBalance});

        if (!result || result.error) {
            console.warn('Не удалось обновить баланс!');
            return false;
        }

        await this.getBalanceUser();
        return true;
    }

    async getBalanceUser(): Promise<void> {
        const result = await HttpUtils.request('/balance', 'GET', true);
        if (result?.response.balance !== undefined) {
            this.updateBalanceForPage(result.response.balance);
        }
    }

    updateBalanceForPage(balance: number): void {
        const balanceElement = document.getElementById('balance');
        if (!balanceElement) {
            console.warn('Элемент с id="balance" не найден!');
            return;
        }
        balanceElement.textContent = `${balance}$`;
    }

    setUserName(): void {
        const userNameForLocalStorage = localStorage.getItem('userInfo');

        if (!userNameForLocalStorage) {
            console.warn('Ошибка при получении имени пользователя!');
            return;
        }

        try {
            const userInfo: UserInfo = JSON.parse(userNameForLocalStorage);
            const userNamePageElement = document.getElementById('user-name');

            if (userNamePageElement) {
                userNamePageElement.textContent = userInfo.name;
            }
        } catch (error) {
            console.error('Ошибка парсинга userInfo:', error);
        }
    }

    rotateArrow(): void {
        document.addEventListener('click', (event: MouseEvent): void => {
            if (!(event.target instanceof HTMLElement)) return;

            const dropdownToggle = event.target.closest('#btn-action');
            if (dropdownToggle) {
                const chevronIcon = dropdownToggle.querySelector('#fa-chevron-right');
                if (chevronIcon instanceof HTMLElement) {
                    chevronIcon.classList.toggle('rotate');
                }
            }
        });
    }

    buttonsControl(): void {
        const buttons = document.querySelectorAll('.nav .btn');
        const collapse = document.getElementById('home-collapse');
        const categoryButton = document.getElementById('btn-action');

        buttons.forEach(button => {
            if (!(button instanceof HTMLElement)) return;

            button.addEventListener('click', (event: Event): void => {
                if (button.tagName === 'A') {
                    event.preventDefault();
                    localStorage.setItem('activeButton', button.getAttribute('href') || '');
                }

                if (button === categoryButton) {
                    const expanded = button.getAttribute('aria-expanded') === 'true';
                    localStorage.setItem('categoryExpanded', expanded ? 'true' : 'false');
                }

                if (button.closest('#home-collapse')) {
                    localStorage.setItem('activeCategory', 'true');
                } else {
                    localStorage.removeItem('activeCategory');
                }

                buttons.forEach(btn => {
                    if (btn instanceof HTMLElement && btn !== categoryButton) {
                        btn.classList.remove('active');
                    }
                });

                button.classList.add('active');

                if (button.closest('#home-collapse') && categoryButton) {
                    categoryButton.classList.add('active');
                }
            });
        });

        const activeButton = localStorage.getItem('activeButton');
        if (activeButton) {
            const activeElement = document.querySelector(`.nav .btn[href="${activeButton}"]`);
            if (activeElement instanceof HTMLElement) {
                activeElement.classList.add('active');

                if (activeElement.closest('#home-collapse') && collapse && categoryButton) {
                    collapse.classList.add('show');
                    categoryButton.setAttribute('aria-expanded', 'true');
                    categoryButton.classList.add('active');
                }
            }
        }

        if (localStorage.getItem('categoryExpanded') === 'true' && collapse && categoryButton) {
            collapse.classList.add('show');
            categoryButton.setAttribute('aria-expanded', 'true');
        }

        if (localStorage.getItem('activeCategory') === 'true' && categoryButton) {
            categoryButton.classList.add('active');
        }
    }
}
