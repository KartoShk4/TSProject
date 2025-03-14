import {HttpUtils} from "../../utils/http-utils";
import {AuthUtils} from "../../utils/auth-utils";
import {Layout} from '../layout.ts';
import * as bootstrap from 'bootstrap';

export class Operations {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;
        this.btnCreateIncome = null;
        this.btnCreateExpenses = null;
        this.changeToDataText();
        this.init();
    }

    async init() {
        // Проверка авторизации
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            return this.openNewRoute('/login');
        }

        this.periodBtns = document.querySelectorAll('.filter');
        this.operations = [];
        this.period = 'today';
        this.dateFromValue = null;
        this.dateToValue = null;
        this.operationsList = document.getElementById('record');
        this.pressBtn();

        // Загрузка категорий и обновление состояния кнопок
        await this.updateButtonStates();

        // Инициализация интервалов
        this.selectInterval();

        // Инициализация Toast
        this.initializeToast();
    }

    // Меняем input text на date при наведении
    changeToDataText() {
        document.body.addEventListener('focusin', (event) => {
            if (event.target.matches('#calendar-from, #calendar-to')) {
                event.target.type = 'date';
            }
        });

        document.body.addEventListener('blur', (event) => {
            if (event.target.matches('#calendar-from, #calendar-to') && !event.target.value) {
                setTimeout(() => {
                    event.target.type = 'text';
                    event.target.placeholder = 'Дата';
                }, 200);  // 200 мс, чтобы избежать мгновенного скрытия
            }
        }, true);
    }

    // Инициализация Toast
    initializeToast() {
        const toastLiveExample = document.getElementById('liveToast');
        if (toastLiveExample) {
            this.toast = new bootstrap.Toast(toastLiveExample);
        }
    }

    // Показываем Toast
    showToast(message) {
        const toastMessage = document.getElementById('toastMessage');
        if (toastMessage && this.toast) {
            toastMessage.innerHTML = message; // Используем innerHTML для вставки HTML
            this.toast.show(); // Показываем Toast
        }
    }

    // Добавляем кнопки (дохода/расхода)
    pressBtn() {
        this.btnCreateIncome = document.getElementById('btn-create-income');
        this.btnCreateExpenses = document.getElementById('btn-create-expenses');
    }

    // Управление поведением кнопок
    async updateButtonStates() {
        const incomeCategories = await this.getIncomeCategories();
        const expenseCategories = await this.getExpenseCategories();

        // Проверка для категорий дохода
        if (this.btnCreateIncome) {
            // Проверяем наличие категорий, если их нет то выключаем переход по ссылкам
            if (incomeCategories.length === 0) {
                this.btnCreateIncome.classList.add('disabled');
                this.btnCreateIncome.removeAttribute('href');
                this.btnCreateIncome.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showToast('Категории доходов отсутствуют. Создайте категории <a href="/income" style="color: #0d6efd; text-decoration: none;">доходов</a>, чтобы продолжить.');
                });
            } else {
                // Если категории есть, то включаем переход по ссылке
                this.btnCreateIncome.classList.remove('disabled');
                this.btnCreateIncome.setAttribute('href', '/create-operations?type=Доход');
            }
        }

        // Проверка для категорий расхода
        if (this.btnCreateExpenses) {
            // Проверяем наличие категорий, если их нет то выключаем переход по ссылкам
            if (expenseCategories.length === 0) {
                this.btnCreateExpenses.classList.add('disabled');
                this.btnCreateExpenses.removeAttribute('href');
                this.btnCreateExpenses.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showToast('Категории расходов отсутствуют. Создайте категории <a href="/expenses" style="color: #0d6efd; text-decoration: none;">расходов</a>, чтобы продолжить.');
                });
            } else {
                // Если категории есть, то включаем переход по ссылке
                this.btnCreateExpenses.classList.remove('disabled');
                this.btnCreateExpenses.setAttribute('href', '/create-operations?type=Расход');
            }
        }
    }

    // Получение категорий дохода
    async getIncomeCategories() {

        const result = await HttpUtils.request('/categories/income');
        if (result.error) {
            alert('Ошибка при запросе категорий доходов.');
            return [];
        }
        // Сохраняем загруженные категории в this.incomeCategories
        this.incomeCategories = result.response;
        return this.incomeCategories;
    }

    // Получение категорий расхода
    async getExpenseCategories() {
        console.log();
        const result = await HttpUtils.request('/categories/expense');
        if (result.error) {
            alert('Ошибка при запросе категорий расходов.');
            return [];
        }
        // Сохраняем загруженные категории в this.expenseCategories
        this.expenseCategories = result.response;
        return this.expenseCategories;
    }

    // Построение таблицы
    processOperations() {
        if (!this.operationsList) {
            return;
        }

        // Очищаем таблицу
        this.operationsList.innerHTML = '';

        // Если операций нет, показываем сообщение
        if (!Array.isArray(this.operations) || this.operations.length === 0) {
            // Создаем строку для сообщения
            const row = document.createElement('tr');

            // Создаем ячейку, которая будет занимать все столбцы
            const messageCell = document.createElement('td');
            messageCell.setAttribute('colspan', '8'); // Укажите количество столбцов в вашей таблице
            messageCell.className = 'text-center'; // Центрируем текст
            messageCell.innerText = 'Нет созданных доходов/расходов. Пожалуйста, создайте хотя бы одну операцию.';

            // Добавляем ячейку в строку
            row.appendChild(messageCell);

            // Добавляем строку в таблицу
            this.operationsList.appendChild(row);
            return; // Прекращаем выполнение, так как операций нет
        }

        // Если операции есть, отрисовываем их
        this.operations.forEach((item) => {
            let categoryTitle = 'Неизвестная категория'; // Значение по умолчанию

            // Определяем категорию для операции (если тип операции доход)
            if (item.type === 'income' && Array.isArray(this.incomeCategories)) {
                const incomeCategory = this.incomeCategories.find(cat => cat.id === item.category_id);
                categoryTitle = incomeCategory ? incomeCategory.name : categoryTitle;
            }

            // Определяем категорию для операции (если тип операции расход)
            else if (item.type === 'expense' && Array.isArray(this.expenseCategories)) {
                const expenseCategory = this.expenseCategories.find(cat => cat.id === item.category_id);
                categoryTitle = expenseCategory ? expenseCategory.name : categoryTitle;
            }

            // Создаем строку для операции
            const row = document.createElement('tr');

            // Столбец с номером
            const numCell = document.createElement('th');
            numCell.setAttribute('scope', 'row');
            numCell.innerText = this.operations.indexOf(item) + 1;
            row.appendChild(numCell);

            // Столбец с типом операции (доход или расход)
            const typeCell = document.createElement('td');
            typeCell.className = item.type === 'income' ? 'income-green' : 'expenses-red';
            typeCell.innerText = item.type === 'income' ? 'Доход' : 'Расход';
            row.appendChild(typeCell);

            // Столбец с категорией
            const categoryCell = document.createElement('td');
            categoryCell.innerText = item.category;
            row.appendChild(categoryCell);

            // Столбец с суммой
            const amountCell = document.createElement('td');
            amountCell.innerText = `${item.amount || 0}$`;
            row.appendChild(amountCell);

            // Столбец с датой
            const dateCell = document.createElement('td');
            dateCell.innerText = item.date ? new Date(item.date).toLocaleDateString() : 'Нет даты';
            row.appendChild(dateCell);

            // Столбец с комментарием
            const commentCell = document.createElement('td');
            commentCell.classList.add('w-25');
            commentCell.setAttribute('maxlength', '20');
            commentCell.innerText = item.comment || '';
            row.appendChild(commentCell);

            // Столбец с кнопкой удаления
            const deleteCell = document.createElement('td');
            deleteCell.className = 'table-icon-cell';
            deleteCell.innerHTML = `<a data-bs-toggle="modal" data-bs-target="#openModalOperationsDelete" data-id="${item.id}"><i class="fa-regular fa-trash-can"></i></a>`;
            row.appendChild(deleteCell);

            // Столбец с кнопкой редактирования
            const editCell = document.createElement('td');
            editCell.className = 'table-icon-cell';
            editCell.innerHTML = `<a class="link-dark" href="/edited-operations?id=${item.id}&title=${encodeURIComponent('Нужно добавить категорию дохода или расхода')}"><i class="fa-solid fa-pen"></i></a>`;
            row.appendChild(editCell);

            // Добавляем строку в таблицу
            this.operationsList.appendChild(row);
        });

        // Добавляем обработчики событий для удаления операций
        this.attachDeleteEventListeners();
    }

    // Привязка обработчиков для кнопок удаления
    attachDeleteEventListeners() {
        const deleteButtons = this.operationsList.querySelectorAll('a[data-bs-toggle="modal"]');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const operationId = e.currentTarget.getAttribute('data-id');
                // Передаем ID операции в модальное окно
                this.showDeleteModal(operationId);
            });
        });
    }

    // Показываем модальное окно
    showDeleteModal(operationId) {
        // Находим кнопки в модальном окне
        const modalFooter = document.getElementById('modalFooter');
        modalFooter.innerHTML = `
        <button type="button" class="btn btn-danger" id="btn-confirm-delete">Удалить</button>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Не удалять</button>
    `;

        // Обработчик кнопки удаления
        const btnConfirmDelete = document.getElementById('btn-confirm-delete');
        btnConfirmDelete.addEventListener('click', () => {
            this.deleteOperation(operationId);  // Удаляем операцию
        });
    }

    // Логика удаления операции
    async deleteOperation(operationId) {
        try {
            const result = await HttpUtils.request(`/operations/${operationId}`, 'DELETE');
            if (result.error) {
                this.showToast('Ошибка при удалении операции');
                return;
            }
            this.showToast('Операция удалена успешно');

            // Закрыть модальное окно после успешного удаления
            const modal = bootstrap.Modal.getInstance(document.getElementById('openModalOperationsDelete'));
            // Скрываем модальное окно
            modal.hide();

            // Обновляем список операций
            await this.getOperations(this.period);

            // Обновляем баланс через Singleton
            const layoutInstance = new Layout();
            await layoutInstance.getBalanceUser();
        } catch (error) {
            console.error('Ошибка при удалении операции:', error);
            this.showToast('Ошибка при удалении операции');
        }
    }

    // Управление фильтрами
    selectInterval() {
        this.getOperations(this.period);
        const activeToday = this.periodBtns[0]
        activeToday.classList.add('active-btn');
        this.periodBtns.forEach(item => {
            item.addEventListener('click', () => {
                this.periodBtns.forEach(itm => {
                    itm.classList.remove('active-btn');
                })
                item.classList.add('active-btn');
                const intervalType = item.getAttribute('id');
                this.dateFromInput = document.getElementById('calendar-from');
                this.dateToInput = document.getElementById('calendar-to');
                this.dateFromInput.value = '';
                this.dateToInput.value = '';
                switch (intervalType) {
                    case 'today':
                        this.getOperations('today');
                        break;
                    case 'week':
                        this.getOperations('week');
                        break;
                    case 'month':
                        this.getOperations('month');
                        break;
                    case 'year':
                        this.getOperations('year');
                        break;
                    case 'all':
                        this.getOperations('all');
                        break;
                    case 'interval':
                        this.operationsList.innerHTML = '';
                        this.dateFromInput.addEventListener('change', () => {
                            this.dateFromValue = this.dateFromInput.value;
                            this.getOperationsFromInterval();
                        });
                        this.dateToInput.addEventListener('change', () => {
                            this.dateToValue = this.dateToInput.value;
                            this.getOperationsFromInterval();
                        });
                        this.getOperationsFromInterval()
                        break;
                }
            });
        });
    }

    getOperationsFromInterval() {
        if (this.dateFromValue && this.dateToValue) {
            this.getOperations('interval', this.dateFromValue, this.dateToValue);
        }
    }

    // Запрос на интервал
    async getOperations(period, dateFrom, dateTo) {
        let params = `?period=${period}`;
        if (period === 'interval' && dateFrom && dateTo) {
            params += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
        }
        try {
            const res = await HttpUtils.request(`/operations${params}`);
            if (res) {
                if (res.error) {
                    throw new Error(res.error);
                }
            }
            this.operations = res.response;
            this.processOperations();
        } catch (e) {
            console.error(e);
        }
    }

}


