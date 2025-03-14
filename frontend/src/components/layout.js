import {HttpUtils} from "../utils/http-utils";

export class Layout {
    constructor() {
        // Устанавливаем имя пользователя на странице.
        this.setUserName();
        // Функционал отвечающий за поворот стрелки
        this.rotateArrow();
        // Получили баланс
        this.getBalanceUser().then();
        // Устанавливаем баланс по кнопке "Сохранить"
        this.balanceBtnFunction();
        // Управление активными кнопками
        this.buttonsControl();
    }

    // Устанавливаем баланс по кнопке "Сохранить"
    balanceBtnFunction() {
        document.getElementById('btn-balance-save').addEventListener('click', () => {
            const balanceInput = document.getElementById('balance-input');
            // Проверяем есть ли какой-либо баланс, если нет то устанавливаем его на ноль, так же если строка пустая.
            const newBalance = balanceInput && balanceInput.value.trim() !== '' ? parseFloat(balanceInput.value) : 0;
            // Обновляем баланс
            this.setBalanceUser(newBalance).then();
        });
    }

    // Функционал обновления баланса
    async setBalanceUser(newBalance) {
        // Делаем запрос на сервер
        const result = await HttpUtils.request('/balance', 'PUT', true, {newBalance});
        // Делаем запрос на сервер
        if (!result || result.error) {
            console.warn('Не удалось обновить баланс!');
            return false;
        }
        // Делаем запрос на получение баланса, если выше ошибок нет
        await this.getBalanceUser();
        return true;
    }

    // Функционал получения баланса
    async getBalanceUser() {
        // Делаем запрос на сервер
        const result = await HttpUtils.request('/balance', 'GET', true);
        // Делаем запрос на сервер
        if (result && result.response && result.response.balance !== undefined) {
            // Делаем запрос на установку баланса на странице, если выше ошибок нет
            this.updateBalanceForPage(result.response.balance);
        }
    }

    // Установка баланса на странице
    updateBalanceForPage(balance) {
        const balanceElement = document.getElementById('balance');
        // делаем проверку на наличие id 'balance' на странице
        if (!balanceElement) {
            console.warn('Элемент с id="balance" не найден!');
            return;
        }
        // Если выше ошибок нет, то показываем актуальный баланс
        balanceElement.textContent = `${balance}$`;
    }

    // Устанавливаем имя пользователя на странице
    setUserName() {
        const userNameForLocalStorage = localStorage.getItem('userInfo');
        const userNamePageElement = document.getElementById('user-name');
        // Выполняем проверку на то что в LocalStorage есть userInfo
        if (userNameForLocalStorage) {
            const userName = JSON.parse(userNameForLocalStorage);
            // После парсинга, если ошибок нет, устанавливаем имя пользователя на страницу.
            userNamePageElement.textContent = userName.name;
        } else {
            console.warn('Ошибка при получении имени пользователя!');
        }
    }

    // Функционал поворота стрелочки
    rotateArrow() {
        document.addEventListener('click', (event) => {
            const dropdownToggle = event.target.closest('#btn-action');
            if (dropdownToggle) {
                const chevronIcon = dropdownToggle.querySelector('#fa-chevron-right');
                // Выполняем проверку на наличие стрелочки на странице (FontAwesome)
                if (chevronIcon) {
                    // Устанавливаем класс
                    chevronIcon.classList.toggle('rotate');
                }
            }
        });
    }

    // Управление активными кнопками
    buttonsControl() {
        const buttons = document.querySelectorAll('.nav .btn'); // Все кнопки
        const collapse = document.getElementById('home-collapse'); // Контейнер вложенных кнопок
        const categoryButton = document.getElementById('btn-action'); // Кнопка "Категории"
        console.log('Найдено кнопок:', buttons.length); // Отладка

        buttons.forEach(button => {
            button.addEventListener('click', function (event) {
                // Если это ссылка — предотвращаем стандартное поведение
                if (this.tagName === 'A') {
                    event.preventDefault();
                    localStorage.setItem('activeButton', this.getAttribute('href'));
                }

                // Если нажали "Категории" — сохраняем её состояние
                if (this === categoryButton) {
                    let expanded = this.getAttribute('aria-expanded') === 'true';
                    localStorage.setItem('categoryExpanded', expanded ? 'true' : 'false');
                }

                console.log('Нажата кнопка:', this);

                // Если нажата "Доходы" или "Расходы", сохраняем активность категории
                if (this.closest('#home-collapse')) {
                    localStorage.setItem('activeCategory', 'true');
                } else {
                    localStorage.removeItem('activeCategory');
                }

                // Удаляем 'active' у всех кнопок, кроме "Категории"
                buttons.forEach(btn => {
                    if (btn !== categoryButton) {
                        btn.classList.remove('active');
                    }
                });

                // Добавляем 'active' к нажатой кнопке
                this.classList.add('active');

                // Если нажата "Доходы" или "Расходы", делаем "Категории" активной
                if (this.closest('#home-collapse')) {
                    categoryButton.classList.add('active');
                }
            });
        });

        // Восстанавливаем активные кнопки при загрузке
        const activeButton = localStorage.getItem('activeButton');
        if (activeButton) {
            const activeElement = document.querySelector(`.nav .btn[href="${activeButton}"]`);
            if (activeElement) {
                activeElement.classList.add('active');

                // Если активная кнопка внутри "Категории" — активируем "Категории"
                if (activeElement.closest('#home-collapse')) {
                    collapse.classList.add('show'); // Разворачиваем категории
                    categoryButton.setAttribute('aria-expanded', 'true');
                    categoryButton.classList.add('active');
                }
            }
        }

        // Восстанавливаем развернутость "Категории"
        if (localStorage.getItem('categoryExpanded') === 'true') {
            collapse.classList.add('show');
            categoryButton.setAttribute('aria-expanded', 'true');
        }

        // Восстанавливаем активность "Категории", если была выбрана вложенная кнопка
        if (localStorage.getItem('activeCategory') === 'true') {
            categoryButton.classList.add('active');
        }
    }

}