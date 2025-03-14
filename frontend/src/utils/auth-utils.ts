import config from "../config/config";

// Интерфейс для токенов
interface Tokens {
    accessToken: string;
    refreshToken: string;
}

// Интерфейс для хранения информации о пользователе
interface UserInfo {
    // Пример поля (можно уточнить, исходя из структуры)
    userId: string;
    username: string;
}

export class AuthUtils {
    static accessTokenKey = 'accessToken';
    static refreshTokenKey = 'refreshToken';
    static userInfoTokenKey = 'userInfo';

    // Устанавливаем значения
    static setAuthInfo(accessToken: string, refreshToken: string, userInfo?: UserInfo): void {
        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
        if (userInfo) {
            localStorage.setItem(this.userInfoTokenKey, JSON.stringify(userInfo));
        }
    }

    // Удаляем значения
    static removeAuthInfo(): void {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userInfoTokenKey);
    }

    // Получаем значения
    static getAuthInfo(key: string | null = null): string | { [key: string]: string | null } {
        if (key && [this.accessTokenKey, this.refreshTokenKey, this.userInfoTokenKey].includes(key)) {
            return localStorage.getItem(key) || ''; // Возвращаем пустую строку, если значение не найдено
        } else {
            return {
                [this.accessTokenKey]: localStorage.getItem(this.accessTokenKey),
                [this.refreshTokenKey]: localStorage.getItem(this.refreshTokenKey),
                [this.userInfoTokenKey]: localStorage.getItem(this.userInfoTokenKey),
            };
        }
    }

    // Обновляем токен
    static async updateRefreshToken(): Promise<boolean> {
        let result = false;
        const refreshToken = this.getAuthInfo(this.refreshTokenKey);
        if (refreshToken) {
            const response = await fetch(config.api + '/refresh', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ refreshToken })
            });

            if (response && response.status === 200) {
                const tokens = await response.json();
                if (tokens && !tokens.error) {
                    this.setAuthInfo(tokens.tokens.accessToken, tokens.tokens.refreshToken);
                    console.log(tokens.tokens.refreshToken);
                    result = true;
                } else {
                    // Логирование ошибки в ответе
                    console.error('Error in tokens:', tokens.error);
                }
            } else {
                // Логирование ошибки
                console.error('Failed to refresh token, status:', response.status);
            }
        }

        // Если обновление не удалось, удаляем информацию о токенах и перенаправляем на страницу авторизации
        if (!result) {
            this.removeAuthInfo();
        }

        return result;
    }
}
