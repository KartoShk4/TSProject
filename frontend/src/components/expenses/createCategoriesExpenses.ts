import { HttpUtils } from "../../utils/http-utils";
import { AuthUtils } from "../../utils/auth-utils";

export class CreateCategoriesExpenses {
    private inputCreateCategories: HTMLInputElement | null | undefined;
    private readonly buttonCreate: HTMLButtonElement | null | undefined;
    private readonly openNewRoute: (route: string) => void;

    constructor(openNewRoute: (route: string) => void) {
        this.openNewRoute = openNewRoute;

        // Выполняем проверку на наличии токена, если его нет
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            // Переводим пользователя на главную страницу
            openNewRoute('/login');
            return;
        }

        // Инициализация элементов DOM
        this.inputCreateCategories = document.getElementById('input-create-categories') as HTMLInputElement;
        this.buttonCreate = document.getElementById('button-create') as HTMLButtonElement;

        // Проверка на null перед добавлением обработчика события
        if (this.buttonCreate) {
            this.createCategoriesButton();
        }
    }

    // Метод для добавления обработчика событий на кнопку
    private createCategoriesButton(): void {
        this.buttonCreate?.addEventListener('click', () => {
            this.createCategories().then();
        });
    }

    // Создание категории расходов
    private async createCategories(): Promise<void> {
        // Проверка, не пустое ли поле input
        const title: string | undefined = this.inputCreateCategories?.value.trim();
        if (!title) {
            alert('Название категории не может быть пустым.');
            return;
        }

        // Отправляем запрос на создание категории
        const result = await HttpUtils.request('/categories/expense', 'POST', true, {
            title: title,
        });

        // Если в ответе есть редирект, вызываем openNewRoute
        if (result.redirect) {
            return this.openNewRoute(result.redirect);
        }

        // Проверяем наличие ошибки в ответе
        if (result.error) {
            console.error('Ошибка при создании категорий расходов:', result);
            alert('Возникла ошибка при создании категорий расходов. Пожалуйста, обратитесь в поддержку!');
            return;
        }

        // Проверка, что ответ не пустой
        if (!result.response || result.response.length === 0) {
            console.warn('Не удалось создать категорию');
            alert('Нет данных для категорий расходов');
            return;
        }

        // Печатаем полученные данные
        console.log('Категории расходов:', result.response);

        // Перенаправляем на страницу с расходами
        this.openNewRoute('/expenses');
    }
}
