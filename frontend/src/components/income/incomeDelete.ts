import {HttpUtils} from "../../utils/http-utils";
import {AuthUtils} from "../../utils/auth-utils";

export class IncomeDelete {
    private readonly openNewRoute: (path: string) => void;

    constructor(openNewRoute: (path: string) => void) {
        this.openNewRoute = openNewRoute;

        // Выполняем проверку на наличии токена, если его нет
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            // Переводим пользователя на главную страницу
            openNewRoute('/login');
            return;
        }

        // Извлекаем ID из URL
        const urlParams = new URLSearchParams(window.location.search);
        const id: string | null = urlParams.get('id');

        if (!id) {
            this.openNewRoute('/income');
            return;
        }

        this.incomeDelete(id).then();
    }

    private async incomeDelete(id: string): Promise<void> {
        const result = await HttpUtils.request('/categories/income/' + id, 'DELETE', true);

        if (result.redirect) {
            this.openNewRoute(result.redirect);
            return;
        }

        // Проверяем наличие ошибки и выводим сообщение
        if (result.error) {
            console.error('Ошибка при удалении категорий доходов:', result);
            alert('Возникла ошибка при удалении категорий доходов. Пожалуйста, обратитесь в поддержку!');
            return;
        }

        this.openNewRoute('/income');
    }
}