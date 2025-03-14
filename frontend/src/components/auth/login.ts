import { AuthUtils } from "../../utils/auth-utils";
import { HttpUtils } from "../../utils/http-utils";

// Определение интерфейса для пользователя
interface UserInfo {
    userId: string;
    username: string;
    name: string;
    lastName: string;
    email: string;
}

export class Login {
    private readonly openNewRoute: (route: string) => void;
    private readonly emailElement: HTMLInputElement | null | undefined;
    private readonly passwordElement: HTMLInputElement | null | undefined;
    private readonly rememberMeElement: HTMLInputElement | null | undefined;
    private readonly commonErrorElement: HTMLElement | null | undefined;

    constructor(openNewRoute: (route: string) => void) {
        this.openNewRoute = openNewRoute;

        // Выполняем проверку на наличии токена, если он есть
        if (AuthUtils.getAuthInfo(AuthUtils.accessTokenKey)) {
            // Переводим пользователя на главную страницу
            openNewRoute('/');
            return;
        }

        // Получаем элементы формы с правильной типизацией
        this.emailElement = document.getElementById('email') as HTMLInputElement | null;
        this.passwordElement = document.getElementById('password') as HTMLInputElement | null;
        this.rememberMeElement = document.getElementById('remember-me') as HTMLInputElement | null;
        this.commonErrorElement = document.getElementById('common-error') as HTMLElement | null;

        // Добавляем обработчик события для кнопки
        const processButton = document.getElementById('process-button');
        processButton?.addEventListener('click', this.login.bind(this));
    }

    // Валидация формы
    private validateForm(): boolean {
        let isValid = true;

        // Валидация email
        if (this.emailElement && this.emailElement.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            this.emailElement.classList.remove('is-invalid');
        } else {
            this.emailElement?.classList.add('is-invalid');
            isValid = false;
        }

        // Валидация пароля
        if (this.passwordElement && this.passwordElement.value) {
            this.passwordElement.classList.remove('is-invalid');
        } else {
            this.passwordElement?.classList.add('is-invalid');
            isValid = false;
        }

        return isValid;
    }

    // Функция для логина
    async login(): Promise<void> {
        // Скрываем ошибку при попытке авторизации
        if (this.commonErrorElement) {
            this.commonErrorElement.style.display = 'none';
        }

        // Если форма валидна, выполняем запрос
        if (this.validateForm()) {
            if (this.emailElement && this.passwordElement && this.rememberMeElement) {
                const result = await HttpUtils.request('/login', 'POST', false, {
                    email: this.emailElement.value,
                    password: this.passwordElement.value,
                    rememberMe: this.rememberMeElement.checked
                });

                // Делаем проверку на то, есть ли эти данные, если нет то выводим ошибку.
                if (result.error || !result.response ||
                    !result.response.tokens?.accessToken ||
                    !result.response.tokens?.refreshToken ||
                    !result.response.user?.id ||
                    !result.response.user?.name ||
                    !result.response.user?.lastName) {

                    if (this.commonErrorElement) {
                        this.commonErrorElement.style.display = 'block';
                    }
                    return;
                }

                // Скрываем ошибку при успешном входе
                if (this.commonErrorElement) {
                    this.commonErrorElement.style.display = 'none';
                }

                // Создаём объект с данными пользователя
                const userInfo: UserInfo = {
                    userId: result.response.user.id,
                    username: result.response.user.username ?? '',
                    name: result.response.user.name,
                    lastName: result.response.user.lastName,
                    email: result.response.user.email
                };

                // Сохраняем токены и данные пользователя
                AuthUtils.setAuthInfo(result.response.tokens.accessToken, result.response.tokens.refreshToken, userInfo);

                // Перенаправляем пользователя на главную страницу
                this.openNewRoute('/');
            }
        }
    }
}
