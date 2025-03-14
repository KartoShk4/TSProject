import { HttpUtils } from "../../utils/http-utils";
import { AuthUtils } from "../../utils/auth-utils";

interface Category {
    id: number;
    title: string;
}

export class Income {
    private readonly openNewRoute: (path: string) => void;
    private categoriesContainer!: HTMLElement; // Добавляем '!' для явного указания, что это свойство будет инициализировано

    constructor(openNewRoute: (path: string) => void) {
        this.openNewRoute = openNewRoute;

        // Проверка авторизации пользователя
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            openNewRoute('/login');
            return;
        }

        // Получение контейнера категорий доходов
        const container: HTMLElement | null = document.getElementById('categories-container');
        if (!container) {
            throw new Error("Не найден контейнер для категорий доходов (id='categories-container')");
        }
        this.categoriesContainer = container;

        // Получение категорий доходов
        this.getIncomeCategories().then();
    }

    // Получение категорий доходов
    private async getIncomeCategories(): Promise<void> {
        try {
            const result = await HttpUtils.request('/categories/income');

            // Если есть редирект, переходим
            if (result.redirect) {
                this.openNewRoute(result.redirect);
                return;
            }

            // Проверка на ошибку
            if (result.error) {
                console.warn('Ошибка при получении категорий доходов:', result);
                alert('Возникла ошибка при запросе категорий доходов. Пожалуйста, обратитесь в поддержку!');
                return;
            }

            // Отображаем полученные категории
            this.showRecords(result.response);
        } catch (error) {
            console.error('Ошибка при запросе:', error);
            alert('Ошибка при загрузке данных. Попробуйте позже.');
        }
    }

    // Отображение категорий
    private showRecords(records: Category[]): void {
        records.forEach(record => {
            const categoryId: number = record.id;
            const categoryTitle: string = record.title;

            // Создаем блок категории
            const categoryBlock: HTMLDivElement = document.createElement('div');
            categoryBlock.classList.add('categories-block');

            const categoryItem: HTMLDivElement = document.createElement('div');
            categoryItem.classList.add('categories-item', 'border', 'rounded-4', 'd-flex', 'flex-column', 'px-3', 'pt-2');

            // Название категории
            const categoryName: HTMLSpanElement = document.createElement('span');
            categoryName.classList.add('fs-3', 'pb-2', 'category-title');
            categoryName.textContent = categoryTitle;

            // Кнопка "Редактировать"
            const btnEdit: HTMLAnchorElement = document.createElement('a');
            btnEdit.href = `/edited-categories-income?id=${categoryId}&title=${encodeURIComponent(categoryTitle)}`;
            btnEdit.classList.add('btn', 'btn-primary', 'me-2');
            btnEdit.textContent = 'Редактировать';

            // Кнопка "Удалить"
            const btnDelete: HTMLButtonElement = document.createElement('button');
            btnDelete.type = 'button';
            btnDelete.classList.add('btn', 'btn-danger');
            btnDelete.setAttribute('data-bs-toggle', 'modal');
            btnDelete.setAttribute('data-bs-target', '#openModalIncomeDelete');
            btnDelete.textContent = 'Удалить';

            // Обработчик клика на кнопку "Удалить"
            btnDelete.addEventListener('click', () : void => {
                const modalFooter: HTMLElement | null = document.getElementById('modalFooter');
                if (!modalFooter) return;

                // Очищаем старое содержимое
                modalFooter.innerHTML = '';

                // Создаем ссылку для удаления
                const deleteLink: HTMLAnchorElement = document.createElement('a');
                deleteLink.href = `/income/delete?id=${categoryId}`;
                deleteLink.classList.add('btn', 'btn-success');
                deleteLink.textContent = 'Да, удалить';

                // Кнопка "Не удалять"
                const cancelButton: HTMLButtonElement = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.classList.add('btn', 'btn-danger');
                cancelButton.setAttribute('data-bs-dismiss', 'modal');
                cancelButton.textContent = 'Не удалять';

                modalFooter.appendChild(deleteLink);
                modalFooter.appendChild(cancelButton);
            });

            // Добавляем кнопки в блок
            const actionsDiv:HTMLDivElement = document.createElement('div');
            actionsDiv.classList.add('actions', 'pb-4');
            actionsDiv.appendChild(btnEdit);
            actionsDiv.appendChild(btnDelete);

            // Собираем элементы в структуру
            categoryItem.appendChild(categoryName);
            categoryItem.appendChild(actionsDiv);
            categoryBlock.appendChild(categoryItem);

            // Добавляем блок в контейнер
            this.categoriesContainer.appendChild(categoryBlock);
        });

        // Добавление кнопки "Создать новую категорию"
        this.addCreateCategoryButton();
    }

    // Добавление кнопки для создания новой категории
    private addCreateCategoryButton(): void {
        const categoryBlockCreate: HTMLDivElement = document.createElement('div');
        categoryBlockCreate.classList.add('categories-block');

        const categoryItemCreate: HTMLAnchorElement = document.createElement('a');
        categoryItemCreate.classList.add(
            'categories-item',
            'border',
            'rounded-4',
            'd-flex',
            'flex-column',
            'px-3',
            'pt-2',
            'align-items-center',
            'justify-content-center',
            'link-underline',
            'link-underline-opacity-0'
        );
        categoryItemCreate.href = '/create-categories-income';
        categoryItemCreate.innerHTML = '<i class="fa-solid fa-plus text-secondary"></i>';

        categoryBlockCreate.appendChild(categoryItemCreate);
        this.categoriesContainer.appendChild(categoryBlockCreate);

        // Закрытие модального окна, если есть оверлей
        const modalBackdrop: Element | null = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.remove();
        }
    }
}
