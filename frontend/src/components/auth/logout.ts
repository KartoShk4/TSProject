import {AuthUtils} from "../../utils/auth-utils";
import {HttpUtils} from "../../utils/http-utils";

export class Logout {
    private readonly openNewRoute: (route: string) => void;


    constructor(openNewRoute: (route: string) => void) {
        this.openNewRoute = openNewRoute;
        this.logout().then();
    }

    private async logout(): Promise<void> {
        try {
            const refreshToken: string | {
                [key: string]: string | null
            } = AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey);

            if (refreshToken) {
                await HttpUtils.request('/logout', 'POST', false, {refreshToken});
            }
            // Удаляем токены при выходе из учетной записи
            AuthUtils.removeAuthInfo();
        } catch (error) {
            console.log("Ошибка при выходе из системы:", error);
        } finally {
            this.openNewRoute('login');
        }
    }
}