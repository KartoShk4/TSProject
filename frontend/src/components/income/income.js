import {HttpUtils} from "../../utils/http-utils";
import {AuthUtils} from "../../utils/auth-utils";

export class Income {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;

        // Выполняем проверку на наличии токена, если его нет
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            // Переводим пользователя на главную страницу
            return openNewRoute('/login');
        }

        // Вызвали функционал получения категорий доходов.
        this.getIncomeCategories().then();

        // Получили общий контейнер категорий доходов
        this.categoriesContainer = document.getElementById('categories-container');
    }

    // Получение категорий доходов.
    async getIncomeCategories() {
        const result = await HttpUtils.request('/categories/income');

        // Если в ответе есть редирект, вызываем openNewRoute
        if (result.redirect) {
            return this.openNewRoute(result.redirect);
        }

        // Проверяем наличие ошибки и выводим сообщение
        if (result.error) {
            console.warn('Ошибка при получении категорий доходов:', result);
            alert('Возникла ошибка при запросе категорий доходов. Пожалуйста, обратитесь в поддержку!');
            return;
        }

        // Отображаем полученные данные
        this.showRecords(result.response);
    }

    // Отображение данных
    showRecords(records) {
        // Проходим по каждому элементу в полученных данных
        records.forEach(record => {
            // Получаем id и название категории
            const categoryId = record.id;
            const categoryTitle = record.title;

            // Создаем блок категории
            const categoryBlock = document.createElement('div');
            categoryBlock.classList.add('categories-block');

            // Создаем элемент в этой категории
            const categoryItem = document.createElement('div');
            categoryItem.classList.add('categories-item', 'border', 'rounded-4', 'd-flex', 'flex-column', 'px-3', 'pt-2');

            // Добавляем название категории
            const categoryName = document.createElement('span');
            categoryName.classList.add('fs-3', 'pb-2', 'category-title');
            categoryName.textContent = categoryTitle;

            // Добавляем кнопку "Редактировать"
            const btnEdit = document.createElement('a');
            btnEdit.href = `/edited-categories-income?id=${categoryId}&title=${encodeURIComponent(categoryTitle)}`;
            btnEdit.classList.add('btn', 'btn-primary', 'me-2');
            btnEdit.textContent = 'Редактировать';

            // Добавляем кнопку "Удалить"
            const btnDelete = document.createElement('button');
            btnDelete.type = 'button';
            btnDelete.classList.add('btn', 'btn-danger');
            btnDelete.setAttribute('data-bs-toggle', 'modal');
            btnDelete.setAttribute('data-bs-target', '#openModalIncomeDelete');
            btnDelete.textContent = 'Удалить';

            // При клике на кнопку "Удалить", обновляем ссылку в модальном окне
            btnDelete.addEventListener('click', () => {
                // Получаем ссылку в модальном окне
                const deleteLink = document.createElement('a');
                deleteLink.href = `/income/delete?id=${categoryId}`;
                // Ссылка для удаления
                deleteLink.classList.add('btn', 'btn-success');
                deleteLink.textContent = 'Да, удалить';

                // Вставляем ссылку в modal-footer
                const modalFooter = document.getElementById('modalFooter');
                // Очищаем старую ссылку (если была)
                modalFooter.innerHTML = '';
                // Вставляем новую ссылку
                modalFooter.appendChild(deleteLink);
                // Также добавляем кнопку "Не удалять"
                const cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.classList.add('btn', 'btn-danger');
                cancelButton.setAttribute('data-bs-dismiss', 'modal');
                cancelButton.textContent = 'Не удалять';
                modalFooter.appendChild(cancelButton);
            });

            // Добавляем кнопки в блок
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('actions', 'pb-4');
            actionsDiv.appendChild(btnEdit);
            actionsDiv.appendChild(btnDelete);

            // Вставляем все элементы в категорию
            categoryItem.appendChild(categoryName);
            categoryItem.appendChild(actionsDiv);

            // Добавляем категорию в блок
            categoryBlock.appendChild(categoryItem);

            // Добавляем блок в контейнер
            this.categoriesContainer.appendChild(categoryBlock);
        });

        // Добавляем кнопку для создания новой категории.
        const categoryBlockCreate = document.createElement('div');
        categoryBlockCreate.classList.add('categories-block');

        // Создаем кнопку создания новой категории
        const categoryItemCreate = document.createElement('a');
        categoryItemCreate.classList.add('categories-item', 'border', 'rounded-4', 'd-flex', 'flex-column', 'px-3', 'pt-2', 'align-items-center', 'justify-content-center', 'link-underline', 'link-underline-opacity-0');
        categoryItemCreate.href = '/create-categories-income';
        categoryItemCreate.innerHTML = '<i class="fa-solid fa-plus text-secondary "></i>';

        // Добавляем категорию в блок
        categoryBlockCreate.appendChild(categoryItemCreate);

        // Добавляем блок в контейнер категорий
        this.categoriesContainer.appendChild(categoryBlockCreate);

        // Закрытие модального окна и удаление оверлея
        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.remove();
        }
    }
}
