import {HttpUtils} from "../../utils/http-utils";
import {AuthUtils} from "../../utils/auth-utils";

export class EditedCategoriesExpenses {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute; // Получаем функцию редиректа

        // Выполняем проверку на наличии токена, если его нет
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            // Переводим пользователя на главную страницу
            return openNewRoute('/login');
        }

        this.inputEdited = document.getElementById('input-edited');
        this.btnEdited = document.getElementById('btn-edited');

        this.btnEdited.addEventListener('click', () => this.editedExpensesCategories());

        // Сразу после загрузки страницы, загружаем название редактируемого расхода
        this.setInitialCategoryTitle();
    }

    // Метод для извлечения ID из URL
    getCategoryIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        // Извлекаем значение параметра id
        return urlParams.get('id');
    };

    // Устанавливаем название из ID в input
    setInitialCategoryTitle() {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryTitle = urlParams.get('title');
        if (categoryTitle) {
            this.inputEdited.value = decodeURIComponent(categoryTitle);
        }
    };

    // Редактирование категории доходов
    async editedExpensesCategories() {
        const categoryId = this.getCategoryIdFromUrl(); // Получаем ID из URL
        if (!categoryId) {
            alert('Не удалось получить ID категории.');
            return;
        }

        // Убираем лишние пробелы из названия
        const newCategoryTitle = this.inputEdited.value.trim();

        // Если поле ввода пустое, выводим предупреждение
        if (!newCategoryTitle) {
            alert('Пожалуйста, введите новое название категории!');
            return;
        }

        // Отправляем запрос на сервер с новым названием категории
        const result = await HttpUtils.request(`/categories/expense/${categoryId}`, 'PUT', true, {title: newCategoryTitle});

        // Проверка на ошибку запроса
        if (result.error) {
            console.error('Ошибка при попытке редактировать категорию расходов:', result);
            alert('Возникла ошибка при редактировании категорий расходов. Пожалуйста, обратитесь в поддержку!');
            return;
        }

        // Обработка редиректа, если он присутствует в ответе
        if (result.redirect) {
            return this.openNewRoute(result.redirect); // Используем переданную функцию для редиректа
        }

        // Если всё прошло успешно, переводим пользователя на страницу доходов
        this.openNewRoute('/expenses'); // Перенаправляем на страницу с доходами
    };
}
