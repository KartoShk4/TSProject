import { HttpUtils } from "../../utils/http-utils";
import { AuthUtils } from "../../utils/auth-utils";

export class EditedCategoriesIncome {
    private readonly openNewRoute: (path: string) => void;
    private readonly inputEdited: HTMLInputElement | null | undefined;
    private readonly btnEdited: HTMLButtonElement | null | undefined;

    constructor(openNewRoute: (path: string) => void) {
        this.openNewRoute = openNewRoute; // Получаем функцию редиректа

        // Выполняем проверку на наличие токена, если его нет
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            // Переводим пользователя на главную страницу
            openNewRoute('/login');
            return;
        }

        // Инициализация элементов
        this.inputEdited = document.getElementById('input-edited') as HTMLInputElement | null;
        this.btnEdited = document.getElementById('btn-edited') as HTMLButtonElement | null;

        // По нажатию на кнопку вызываем функцию editedIncomeCategories()
        if (this.btnEdited) {
            this.btnEdited.addEventListener('click', () => this.editedIncomeCategories());
        }

        // Сразу после загрузки страницы, загружаем название редактируемого дохода
        this.setInitialCategoryTitle();
    }

    // Метод для извлечения ID из URL
    getCategoryIdFromUrl(): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        // Извлекаем значение параметра id
        return urlParams.get('id');
    }

    // Устанавливаем название из ID в input
    setInitialCategoryTitle(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryTitle = urlParams.get('title');
        if (categoryTitle && this.inputEdited) {
            this.inputEdited.value = decodeURIComponent(categoryTitle);
        }
    }


    // Редактирование категории доходов
    async editedIncomeCategories(): Promise<void> {
        // Получаем ID из URL
        const categoryId = this.getCategoryIdFromUrl();
        if (!categoryId) {
            console.warn('Не удалось получить ID категории.');
            return;
        }

        // Убираем лишние пробелы из названия
        const newCategoryTitle = this.inputEdited ? this.inputEdited.value.trim() : '';
        if (!newCategoryTitle) {
            console.warn('Пожалуйста, введите новое название категории!');
            return;
        }

        // Отправляем запрос на сервер с новым названием категории
        const result = await HttpUtils.request(`/categories/income/${categoryId}`, 'PUT', true, { title: newCategoryTitle });

        // Проверка на ошибку запроса
        if (result.error) {
            console.error('Ошибка при попытке редактировать категорию доходов:', result);
            alert('Возникла ошибка при редактировании категорий доходов. Пожалуйста, обратитесь в поддержку!');
            return;
        }

        // Обработка редиректа, если он присутствует в ответе
        if (result.redirect) {
            // Используем переданную функцию для редиректа
            return this.openNewRoute(result.redirect);
        }

        // Если всё прошло успешно, переводим пользователя на страницу доходов
        this.openNewRoute('/income');
    }
}
