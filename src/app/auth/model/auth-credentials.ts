import {User} from "../../../../electron/src/sbg-api-client/interfaces/user";
import {UserPlatformIdentifier} from "./user-platform-identifier";

interface PlatformEntry {
    name: string;
    shortName: string;
    devTokenURL: string;
}

export class AuthCredentials implements UserPlatformIdentifier {

    static readonly URL_VALIDATION_REGEXP = "^(https:\/\/)(.+)(\.sbgenomics\.com)$";

    static readonly TOKEN_VALIDATION_REGEXP = "^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$";

    static readonly platformLookupByAPIURL: { [key: string]: PlatformEntry } = {
        "https://api.sbgenomics.com": {
            "name": "Seven Bridges",
            "shortName": "SBG",
            "devTokenURL": "https://igor.sbgenomics.com/developer#token",
        },
        "https://eu-api.sbgenomics.com": {
            "name": "Seven Bridges (EU)",
            "shortName": "SBG-EU",
            "devTokenURL": "https://eu.sbgenomics.com/developer#token",
        },
        "https://api.sevenbridges.cn": {
            "name": "Seven Bridges (China)",
            "shortName": "SBG-CN",
            "devTokenURL": "https://platform.sevenbridges.cn/developer#token",
        },
        "https://cgc-api.sbgenomics.com": {
            "name": "Cancer Genomics Cloud",
            "shortName": "CGC",
            "devTokenURL": "https://cgc.sbgenomics.com/developer#token",
        },
        "https://cavatica-api.sbgenomics.com": {
            "name": "Cavatica",
            "shortName": "CAVATICA",
            "devTokenURL": "https://cavatica.sbgenomics.com/developer#token",
        },
        "https://f4c-api.sbgenomics.com": {
            "name": "Fair4Cures",
            "shortName": "F4C",
            "devTokenURL": "https://f4c.sbgenomics.com/developer#token",
        },
    };

    id: string;
    user: User;
    url: string;
    token: string;

    constructor(url: string, token: string, user: User) {
        // this.ensureValidURL(url);
        // this.ensureValidToken(token);

        this.url   = url;
        this.token = token;
        this.user  = user;

        this.id = this.getHash();
    }

    static isValidToken(token: string): boolean {
        return new RegExp(AuthCredentials.TOKEN_VALIDATION_REGEXP).test(token);
    }

    static isValidURL(url: string): boolean {
        return new RegExp(AuthCredentials.URL_VALIDATION_REGEXP).test(url);
    }

    static getSubdomain(url: string): string {
        return url.slice(8, url.length - 15);
    }

    static getPlatformShortName(url: string): string {
        return AuthCredentials.getPlatformPropertyValue(url, "shortName");
    }

    static getPlatformLabel(url: string): string {
        return AuthCredentials.getPlatformPropertyValue(url, "name");
    }

    static from(obj?: UserPlatformIdentifier): AuthCredentials | undefined {
        if (!obj) {
            return undefined;
        }
        return new AuthCredentials(obj.url, obj.token, obj.user);
    }

    /**
     * Checks whether a pair of credentials contain the same user.
     * It differs from the {@link AuthCredentials.equals} method in that x and y can be undefined.
     *
     * @see {@link AuthCredentials.equals} Instance method for comparing equality to another instance
     */
    static isSimilar(x?: AuthCredentials, y?: AuthCredentials): boolean {
        const onlyXExists  = x !== undefined && y === undefined;
        const onlyYExists  = y !== undefined && x === undefined;
        const neitherExist = x === undefined && y === undefined;

        if (onlyXExists || onlyYExists) {
            return false;
        }

        if (neitherExist) {
            return true;
        }

        return x.equals(y);
    }

    getHash(): string {
        const subdomain = AuthCredentials.getSubdomain(this.url);
        return `${subdomain}_${this.user.username}`;
    }

    /**
     * Checks whether given credentials are considered equal to this one.
     * Equality is based on API endpoint and username associated with the token.
     *
     * @see {@link AuthCredentials.isSimilar} Static function for pair comparison
     */
    equals(credentials: AuthCredentials): boolean {
        if (!credentials) {
            return false;
        }

        return this.getHash() === credentials.getHash();
    }

    updateToMatch(credentials: AuthCredentials): void {
        this.url   = credentials.url;
        this.token = credentials.token;
        this.user  = credentials.user;
    }

    private ensureValidToken(token: string): void {
        if (AuthCredentials.isValidToken(token) === false) {
            throw new Error("Given token is not valid: " + token);
        }
    }

    private ensureValidURL(url: string): void {
        if (AuthCredentials.isValidURL(url) === false) {
            throw new Error("Invalid platform URL: " + url);
        }
    }

    private static getPlatformPropertyValue(url: string, property: keyof PlatformEntry): string {

        const platform = this.platformLookupByAPIURL[url];
        const subdomain = AuthCredentials.getSubdomain(url);

        return platform ? platform[property]
            : (subdomain.indexOf("vayu") === -1 ? subdomain : subdomain.split(".")[0]);
    }

}
