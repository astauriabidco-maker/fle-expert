"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
var common_1 = require("@nestjs/common");
var crypto = require("crypto");
var SecurityService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SecurityService = _classThis = /** @class */ (function () {
        function SecurityService_1() {
            this.salt = process.env.HASH_SALT || 'ma_cle_secrete_2026';
        }
        /**
         * Generates a SHA-256 hash of the input string with a salt.
         * @param data The data to hash.
         * @param salt The salt to use (optional, generates a random one if not provided).
         * @returns Object containing the hash and the salt used.
         */
        SecurityService_1.prototype.hashWithSalt = function (data, salt) {
            var usedSalt = salt || crypto.randomBytes(16).toString('hex');
            var hash = crypto
                .createHmac('sha256', usedSalt)
                .update(data)
                .digest('hex');
            return { hash: hash, salt: usedSalt };
        };
        /**
         * Verifies if the data matches the hash using the provided salt.
         */
        SecurityService_1.prototype.verifyHash = function (data, hash, salt) {
            var newHash = this.hashWithSalt(data, salt).hash;
            return newHash === hash;
        };
        /**
         * Génère une empreinte numérique infalsifiable pour un résultat d'examen
         */
        SecurityService_1.prototype.generateResultHash = function (userId, score, date) {
            // On combine les données avec un "sel" pour rendre le hash impossible à deviner
            var dataToHash = "".concat(userId, "-").concat(score, "-").concat(date, "-").concat(this.salt);
            return crypto
                .createHash('sha256')
                .update(dataToHash)
                .digest('hex');
        };
        /**
         * Vérifie si un hash correspond bien aux données fournies
         */
        SecurityService_1.prototype.verifyIntegrity = function (userId, score, date, hashToVerify) {
            var generatedHash = this.generateResultHash(userId, score, date);
            return generatedHash === hashToVerify;
        };
        return SecurityService_1;
    }());
    __setFunctionName(_classThis, "SecurityService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SecurityService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SecurityService = _classThis;
}();
exports.SecurityService = SecurityService;
