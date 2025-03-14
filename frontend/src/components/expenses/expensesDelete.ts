import { HttpUtils } from "../../utils/http-utils";
import { AuthUtils } from "../../utils/auth-utils";

export class ExpensesDelete {
    private readonly openNewRoute: (path: string) => void;

    constructor(openNewRoute: (path: string) => void) {
        this.openNewRoute = openNewRoute;

        // Выполняем проверку на наличие токена, если его нет
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            // Переводим пользователя на главную страницу
            openNewRoute('/login');
            return;
        }

        // Метод для извлечения ID из URL
        const urlParams = new URLSearchParams(window.location.search);
        const id: string | null = urlParams.get('id');

        // Если ID не найден, редиректим на страницу с расходами
        if (!id) {
            this.openNewRoute('/expenses');
            return;
        }

        // Вызываем метод для удаления категории расходов
        this.expensesDelete(id).then();
    }

    // Удаление категории расходов
    private async expensesDelete(id: string): Promise<void> {
        const result = await HttpUtils.request(`/categories/expense/${id}`, 'DELETE', true);

        // Если в ответе есть редирект, вызываем openNewRoute
        if (result.redirect) {
            return this.openNewRoute(result.redirect);
        }

        // Проверка на ошибку и вывод сообщения
        if (result.error) {
            console.error('Ошибка при удалении категорий расходов:', result);
            return alert('Возникла ошибка при удалении категорий расходов. Пожалуйста, обратитесь в поддержку!');
        }

        // Перенаправление на страницу с расходами после успешного удаления
        return this.openNewRoute('/expenses');
    }
}
