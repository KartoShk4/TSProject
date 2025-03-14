import { HttpUtils } from "../../utils/http-utils";
import { AuthUtils } from "../../utils/auth-utils";

export class CreateCategoriesIncome {
    private readonly openNewRoute: (path: string) => void;
    private readonly inputCreateCategories: HTMLInputElement | null | undefined;
    private readonly buttonCreate: HTMLButtonElement | null | undefined;

    constructor(openNewRoute: (path: string) => void) {
        this.openNewRoute = openNewRoute;

        // Выполняем проверку на наличие токена, если его нет
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            // Переводим пользователя на главную страницу
            openNewRoute('/login');
            return;
        }

        // Инициализация элементов
        this.inputCreateCategories = document.getElementById('input-create-categories') as HTMLInputElement | null;
        this.buttonCreate = document.getElementById('button-create') as HTMLButtonElement | null;

        this.createCategoriesButton();
    }

    // Инициализация обработчика события на кнопку
    private createCategoriesButton(): void {
        if (this.buttonCreate) {
            this.buttonCreate.addEventListener('click', () => {
                this.createCategories().then();
            });
        }
    }

    // Создание категории доходов
    private async createCategories(): Promise<void> {
        // Выполнили проверку, не пустое ли поле input, если пустое, прекращаем выполнение кода.
        if (!this.inputCreateCategories) return;
        const title = this.inputCreateCategories.value.trim();
        if (!title) {
            alert('Название категории не может быть пустым.');
            return;
        }

        // Отправка запроса на создание категории
        const result = await HttpUtils.request('/categories/income', 'POST', true, {
            title: title,
        });

        // Если в ответе есть редирект, вызываем openNewRoute
        if (result.redirect) {
            this.openNewRoute(result.redirect);
            return;
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
        this.openNewRoute('/income');
    }
}
