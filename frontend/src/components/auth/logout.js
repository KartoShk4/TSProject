import {AuthUtils} from "../../utils/auth-utils";
import {HttpUtils} from "../../utils/http-utils";

export class Logout {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;
        this.logout().then();
    }

    async logout() {
        // Выполняем запрос авторизации
        await HttpUtils.request('/logout', 'POST', false , {
            refreshToken: AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)
        });

        // Удаляем токены при выходе из учетной записи
        AuthUtils.removeAuthInfo();

        // Переводим пользователя на страницу авторизации.
        this.openNewRoute('/login');
    }
}