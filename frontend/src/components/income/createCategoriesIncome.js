import {HttpUtils} from "../../utils/http-utils";
import {AuthUtils} from "../../utils/auth-utils";

export class CreateCategoriesIncome {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;

        // Выполняем проверку на наличии токена, если его нет
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            // Переводим пользователя на главную страницу
            return openNewRoute('/login');
        }

        this.inputCreateCategories = document.getElementById('input-create-categories');
        this.buttonCreate = document.getElementById('button-create');

        this.createCategoriesButton()
    }

    createCategoriesButton() {
        this.buttonCreate.addEventListener('click', () => {
            this.createCategories().then();
        })
    }

    // Создание функции для "Создания категории доходов"
    async createCategories() {
        // Выполнили проверку, не пустое ли поле input, если пустое, прекращаем выполнение кода.
        const title = this.inputCreateCategories.value.trim();
        if (!title) {
            alert('Название категории не может быть пустым.');
            return;
        }
        const result = await HttpUtils.request('/categories/income', 'POST', true, {
            title: this.inputCreateCategories.value,
        });



        // Если в ответе есть редирект, вызываем openNewRoute
        if (result.redirect) {
            return this.openNewRoute(result.redirect);
        }

        // Проверяем наличие ошибки и выводим сообщение
        if (result.error) {
            console.error('Ошибка при создании категорий доходов:', result);
            alert('Возникла ошибка при создании категорий доходов. Пожалуйста, обратитесь в поддержку!');
            return;
        }

        // Проверка, что ответ не пустой
        if (!result.response || result.response.length === 0) {
            console.warn('Не удалось создать категорию');
            alert('Нет данных для категорий доходов');
            return;
        }

        // Печатаем полученные данные
        this.openNewRoute('/income')
    }
}