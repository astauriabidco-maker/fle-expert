"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateController = void 0;
var common_1 = require("@nestjs/common");
var CertificateController = function () {
    var _classDecorators = [(0, common_1.Controller)('certificate')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _verifyCertificate_decorators;
    var _generateCertificate_decorators;
    var _downloadCertificate_decorators;
    var CertificateController = _classThis = /** @class */ (function () {
        function CertificateController_1(prisma, certificateService, securityService) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.certificateService = certificateService;
            this.securityService = securityService;
        }
        CertificateController_1.prototype.verifyCertificate = function (hash) {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.examSession.findUnique({
                                where: { scoreHash: hash },
                                include: { user: true, organization: true }
                            })];
                        case 1:
                            session = _a.sent();
                            if (!session) {
                                return [2 /*return*/, { valid: false, message: "Certificat introuvable ou falsifié." }];
                            }
                            return [2 /*return*/, {
                                    valid: true,
                                    candidate: session.user.name,
                                    organization: session.organization.name,
                                    score: session.score,
                                    date: session.createdAt,
                                    level: session.estimatedLevel // Mapping to "estimatedLevel" as per schema
                                }];
                    }
                });
            });
        };
        // Temporary endpoint for manual testing/generation
        CertificateController_1.prototype.generateCertificate = function (body, res) {
            return __awaiter(this, void 0, void 0, function () {
                var fakeId, date, hash, pdfBuffer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fakeId = 'demo-id';
                            date = new Date().toISOString();
                            hash = this.securityService.generateResultHash(fakeId, body.score, date);
                            return [4 /*yield*/, this.certificateService.generatePdf(body.name, new Date().toLocaleDateString('fr-FR'), body.score, body.level, body.orgName, hash)];
                        case 1:
                            pdfBuffer = _a.sent();
                            res.set({
                                'Content-Type': 'application/pdf',
                                'Content-Disposition': "attachment; filename=certificate.pdf",
                                'Content-Length': pdfBuffer.length,
                            });
                            res.end(pdfBuffer);
                            return [2 /*return*/];
                    }
                });
            });
        };
        CertificateController_1.prototype.downloadCertificate = function (sessionId, res) {
            return __awaiter(this, void 0, void 0, function () {
                var session, score, level, pdfBuffer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.examSession.findUnique({
                                where: { id: sessionId },
                                include: { user: true, organization: true }
                            })];
                        case 1:
                            session = _a.sent();
                            if (!session || session.status !== 'COMPLETED' || !session.scoreHash) {
                                // In real app maybe return 404 or 400
                                return [2 /*return*/, res.status(404).json({ message: "Certificat non disponible." })];
                            }
                            score = session.score || 0;
                            level = session.estimatedLevel || "N/A";
                            return [4 /*yield*/, this.certificateService.generatePdf(session.user.name || "Candidat", // handle nullable name
                                session.createdAt.toLocaleDateString('fr-FR'), score, level, session.organization.name, session.scoreHash)];
                        case 2:
                            pdfBuffer = _a.sent();
                            res.set({
                                'Content-Type': 'application/pdf',
                                'Content-Disposition': "attachment; filename=certificate-".concat(sessionId, ".pdf"),
                                'Content-Length': pdfBuffer.length,
                            });
                            res.end(pdfBuffer);
                            return [2 /*return*/];
                    }
                });
            });
        };
        return CertificateController_1;
    }());
    __setFunctionName(_classThis, "CertificateController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _verifyCertificate_decorators = [(0, common_1.Get)('verify/:hash')];
        _generateCertificate_decorators = [(0, common_1.Post)('generate')];
        _downloadCertificate_decorators = [(0, common_1.Get)('download/:sessionId')];
        __esDecorate(_classThis, null, _verifyCertificate_decorators, { kind: "method", name: "verifyCertificate", static: false, private: false, access: { has: function (obj) { return "verifyCertificate" in obj; }, get: function (obj) { return obj.verifyCertificate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateCertificate_decorators, { kind: "method", name: "generateCertificate", static: false, private: false, access: { has: function (obj) { return "generateCertificate" in obj; }, get: function (obj) { return obj.generateCertificate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _downloadCertificate_decorators, { kind: "method", name: "downloadCertificate", static: false, private: false, access: { has: function (obj) { return "downloadCertificate" in obj; }, get: function (obj) { return obj.downloadCertificate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CertificateController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CertificateController = _classThis;
}();
exports.CertificateController = CertificateController;
