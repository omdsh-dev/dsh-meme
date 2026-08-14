import { createRequire } from "node:module";
import { createReadStream, existsSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineTool } from "@deepseek-ai/dsh-tools";
//#region ../test-ShiroEirin/vendor/cosmokit/lib/index.js
/** Return true when a value is `null` or `undefined`. */
function isNullable(value) {
	return value === null || value === void 0;
}
/** Return true for non-array object values. */
function isPlainObject(data) {
	return data && typeof data === "object" && !Array.isArray(data);
}
/** Filter object entries and return a new object. */
function filterKeys(object, filter) {
	return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
/** Map object values while preserving the original key set. */
function mapValues(object, transform) {
	return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
/** Pick selected keys from an object, optionally including `undefined` values. */
function pick(source, keys, forced) {
	if (!keys) return { ...source };
	const result = {};
	for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
	return result;
}
/** Test values using `instanceof` with a `toStringTag` fallback. */
function is(type, value) {
	if (arguments.length === 1) return (value) => is(type, value);
	return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
	return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
	return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
/** Binary source detection and base64/hex conversion helpers. */
var Binary;
(function(Binary) {
	Binary.is = isArrayBufferLike;
	Binary.isSource = isArrayBufferSource;
	function fromSource(source) {
		if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
		else return source;
	}
	Binary.fromSource = fromSource;
	function toBase64(source) {
		source = fromSource(source);
		if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
		let binary = "";
		const bytes = new Uint8Array(source);
		for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
		return btoa(binary);
	}
	Binary.toBase64 = toBase64;
	function fromBase64(source) {
		if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
		return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
	}
	Binary.fromBase64 = fromBase64;
	function toHex(source) {
		source = fromSource(source);
		if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
		return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
	}
	Binary.toHex = toHex;
	function fromHex(source) {
		if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
		const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
		const buffer = [];
		for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
		return Uint8Array.from(buffer).buffer;
	}
	Binary.fromHex = fromHex;
})(Binary || (Binary = {}));
Binary.fromBase64;
Binary.toBase64;
Binary.fromHex;
Binary.toHex;
/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
function clone(source, refs = /* @__PURE__ */ new Map()) {
	if (!source || typeof source !== "object") return source;
	if (is("Date", source)) return new Date(source.valueOf());
	if (is("RegExp", source)) return new RegExp(source.source, source.flags);
	if (isArrayBufferLike(source)) return source.slice(0);
	if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
	const cached = refs.get(source);
	if (cached) return cached;
	if (Array.isArray(source)) {
		const result = [];
		refs.set(source, result);
		source.forEach((value, index) => {
			result[index] = Reflect.apply(clone, null, [value, refs]);
		});
		return result;
	}
	const result = Object.create(Object.getPrototypeOf(source));
	refs.set(source, result);
	for (const key of Reflect.ownKeys(source)) {
		const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
		if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
		Reflect.defineProperty(result, key, descriptor);
	}
	return result;
}
/** Deeply compare arrays, dates, regexps, buffers, and plain object fields. */
function deepEqual(a, b, strict) {
	if (a === b) return true;
	if (!strict && isNullable(a) && isNullable(b)) return true;
	if (typeof a !== typeof b) return false;
	if (typeof a !== "object") return false;
	if (!a || !b) return false;
	function check(test, then) {
		return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
	}
	return check(Array.isArray, (a, b) => a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
		if (a.byteLength !== b.byteLength) return false;
		const viewA = new Uint8Array(a);
		const viewB = new Uint8Array(b);
		for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
		return true;
	}) ?? Object.keys({
		...a,
		...b
	}).every((key) => deepEqual(a[key], b[key], strict));
}
/** Time constants plus parsing and formatting helpers. */
var Time;
(function(Time) {
	Time.millisecond = 1;
	Time.second = 1e3;
	Time.minute = Time.second * 60;
	Time.hour = Time.minute * 60;
	Time.day = Time.hour * 24;
	Time.week = Time.day * 7;
	let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
	function setTimezoneOffset(offset) {
		timezoneOffset = offset;
	}
	Time.setTimezoneOffset = setTimezoneOffset;
	function getTimezoneOffset() {
		return timezoneOffset;
	}
	Time.getTimezoneOffset = getTimezoneOffset;
	function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
		if (typeof date === "number") date = new Date(date);
		if (offset === void 0) offset = timezoneOffset;
		return Math.floor((date.valueOf() / Time.minute - offset) / 1440);
	}
	Time.getDateNumber = getDateNumber;
	function fromDateNumber(value, offset) {
		const date = new Date(value * Time.day);
		if (offset === void 0) offset = timezoneOffset;
		return new Date(+date + offset * Time.minute);
	}
	Time.fromDateNumber = fromDateNumber;
	const numeric = /\d+(?:\.\d+)?/.source;
	const timeRegExp = new RegExp(`^${[
		"w(?:eek(?:s)?)?",
		"d(?:ay(?:s)?)?",
		"h(?:our(?:s)?)?",
		"m(?:in(?:ute)?(?:s)?)?",
		"s(?:ec(?:ond)?(?:s)?)?"
	].map((unit) => `(${numeric}${unit})?`).join("")}$`);
	function parseTime(source) {
		const capture = timeRegExp.exec(source);
		if (!capture) return 0;
		return (parseFloat(capture[1]) * Time.week || 0) + (parseFloat(capture[2]) * Time.day || 0) + (parseFloat(capture[3]) * Time.hour || 0) + (parseFloat(capture[4]) * Time.minute || 0) + (parseFloat(capture[5]) * Time.second || 0);
	}
	Time.parseTime = parseTime;
	function parseDate(date) {
		const parsed = parseTime(date);
		if (parsed) date = Date.now() + parsed;
		else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
		else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
		return date ? new Date(date) : /* @__PURE__ */ new Date();
	}
	Time.parseDate = parseDate;
	function format(ms) {
		const abs = Math.abs(ms);
		if (abs >= Time.day - Time.hour / 2) return Math.round(ms / Time.day) + "d";
		else if (abs >= Time.hour - Time.minute / 2) return Math.round(ms / Time.hour) + "h";
		else if (abs >= Time.minute - Time.second / 2) return Math.round(ms / Time.minute) + "m";
		else if (abs >= Time.second) return Math.round(ms / Time.second) + "s";
		return ms + "ms";
	}
	Time.format = format;
	function toDigits(source, length = 2) {
		return source.toString().padStart(length, "0");
	}
	Time.toDigits = toDigits;
	function template(template, time = /* @__PURE__ */ new Date()) {
		return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
	}
	Time.template = template;
})(Time || (Time = {}));
//#endregion
//#region ../test-ShiroEirin/vendor/schemastery/lib/index.mjs
const kSchema = Symbol.for("schemastery");
const kValidationError = Symbol.for("ValidationError");
globalThis.__schemastery_index__ ??= 0;
globalThis.__schemastery_refs__ = void 0;
var ValidationError = class extends TypeError {
	options;
	name = "ValidationError";
	constructor(message, options) {
		let prefix = "$";
		for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
		else if (typeof segment === "number") prefix += "[" + segment + "]";
		else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
		if (prefix.startsWith(".")) prefix = prefix.slice(1);
		super((prefix === "$" ? "" : `${prefix} `) + message);
		this.options = options;
	}
	static is(error) {
		return !!error?.[kValidationError];
	}
};
Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
const Schema = function(options) {
	const schema = function(data, options = {}) {
		return Schema.resolve(data, schema, options)[0];
	};
	if (options.refs) {
		const refs = mapValues(options.refs, (options) => new Schema(options));
		const getRef = (uid) => refs[uid];
		for (const key in refs) {
			const options = refs[key];
			options.sKey = getRef(options.sKey);
			options.inner = getRef(options.inner);
			options.list = options.list && options.list.map(getRef);
			options.dict = options.dict && mapValues(options.dict, getRef);
		}
		return refs[options.uid];
	}
	Object.assign(schema, options);
	if (typeof schema.callback === "string") try {
		schema.callback = new Function("return " + schema.callback)();
	} catch {}
	Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
	Object.setPrototypeOf(schema, Schema.prototype);
	schema.meta ||= {};
	schema.toString = schema.toString.bind(schema);
	return schema;
};
Schema.prototype = Object.create(Function.prototype);
Schema.prototype[kSchema] = true;
Object.defineProperty(Schema.prototype, "~standard", { get() {
	return {
		version: 1,
		vendor: "schemastery",
		validate: (value) => {
			try {
				return { value: Schema.resolve(value, this, {})[0] };
			} catch (error) {
				if (ValidationError.is(error)) return { issues: [{
					message: error.message,
					path: error.options.path
				}] };
				throw error;
			}
		}
	};
} });
Schema.ValidationError = ValidationError;
Schema.prototype.toJSON = function toJSON() {
	if (globalThis.__schemastery_refs__) {
		globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
		return this.uid;
	}
	globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
	globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
	const result = {
		uid: this.uid,
		refs: globalThis.__schemastery_refs__
	};
	globalThis.__schemastery_refs__ = void 0;
	return result;
};
Schema.prototype.set = function set(key, value) {
	this.dict[key] = value;
	return this;
};
Schema.prototype.push = function push(value) {
	this.list.push(value);
	return this;
};
function mergeDesc(original, messages) {
	const result = typeof original === "string" ? { "": original } : { ...original };
	for (const locale in messages) {
		const value = messages[locale];
		if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
		else if (typeof value === "string") result[locale] = value;
	}
	return result;
}
function getInner(value) {
	return value?.$value ?? value?.$inner;
}
function extractKeys(data) {
	return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
}
Schema.prototype.i18n = function i18n(messages) {
	const schema = Schema(this);
	const desc = mergeDesc(schema.meta.description, messages);
	if (Object.keys(desc).length) schema.meta.description = desc;
	if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
		return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
	});
	if (schema.list) schema.list = schema.list.map((inner, index) => {
		return inner.i18n(mapValues(messages, (data = {}) => {
			if (Array.isArray(getInner(data))) return getInner(data)[index];
			if (Array.isArray(data)) return data[index];
			return extractKeys(data);
		}));
	});
	if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
		if (getInner(data)) return getInner(data);
		return extractKeys(data);
	}));
	if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
	return schema;
};
Schema.prototype.extra = function extra(key, value) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		[key]: value
	};
	return schema;
};
for (const key of [
	"required",
	"disabled",
	"collapse",
	"hidden",
	"loose"
]) Object.assign(Schema.prototype, { [key](value = true) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		[key]: value
	};
	return schema;
} });
Schema.prototype.deprecated = function deprecated() {
	const schema = Schema(this);
	schema.meta.badges ||= [];
	schema.meta.badges.push({
		text: "deprecated",
		type: "danger"
	});
	return schema;
};
Schema.prototype.experimental = function experimental() {
	const schema = Schema(this);
	schema.meta.badges ||= [];
	schema.meta.badges.push({
		text: "experimental",
		type: "warning"
	});
	return schema;
};
Schema.prototype.pattern = function pattern(regexp) {
	const schema = Schema(this);
	const pattern = pick(regexp, ["source", "flags"]);
	schema.meta = {
		...schema.meta,
		pattern
	};
	return schema;
};
Schema.prototype.simplify = function simplify(value) {
	if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
	if (isNullable(value)) return value;
	if (this.type === "object" || this.type === "dict") {
		const result = {};
		for (const key in value) {
			const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
			if (this.type === "dict" || !isNullable(item)) result[key] = item;
		}
		if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
		return result;
	} else if (this.type === "array" || this.type === "tuple") {
		const result = [];
		value.forEach((value, index) => {
			const schema = this.type === "array" ? this.inner : this.list[index];
			const item = schema ? schema.simplify(value) : value;
			result.push(item);
		});
		return result;
	} else if (this.type === "intersect") {
		const result = {};
		for (const item of this.list) Object.assign(result, item.simplify(value));
		return result;
	} else if (this.type === "union") for (const schema of this.list) try {
		Schema.resolve(value, schema, {});
		return schema.simplify(value);
	} catch {}
	return value;
};
Schema.prototype.toString = function toString(inline) {
	return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
};
Schema.prototype.role = function role(role, extra) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		role,
		extra
	};
	return schema;
};
for (const key of [
	"default",
	"link",
	"comment",
	"description",
	"max",
	"min",
	"step"
]) Object.assign(Schema.prototype, { [key](value) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		[key]: value
	};
	return schema;
} });
const resolvers = {};
Schema.extend = function extend(type, resolve) {
	resolvers[type] = resolve;
};
Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
	if (!schema) return [data];
	if (options.ignore?.(data, schema)) return [data];
	if (isNullable(data) && schema.type !== "lazy") {
		if (schema.meta.required) throw new ValidationError(`missing required value`, options);
		let current = schema;
		let fallback = schema.meta.default;
		while (current?.type === "intersect" && isNullable(fallback)) {
			current = current.list[0];
			fallback = current?.meta.default;
		}
		if (isNullable(fallback)) return [data];
		data = clone(fallback);
	}
	const callback = resolvers[schema.type];
	if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
	try {
		return callback(data, schema, options, strict);
	} catch (error) {
		if (!schema.meta.loose) throw error;
		return [schema.meta.default];
	}
};
Schema.from = function from(source) {
	if (isNullable(source)) return Schema.any();
	else if ([
		"string",
		"number",
		"boolean"
	].includes(typeof source)) return Schema.const(source).required();
	else if (source[kSchema]) return source;
	else if (typeof source === "function") switch (source) {
		case String: return Schema.string().required();
		case Number: return Schema.number().required();
		case Boolean: return Schema.boolean().required();
		case Function: return Schema.function().required();
		default: return Schema.is(source).required();
	}
	else throw new TypeError(`cannot infer schema from ${source}`);
};
Schema.lazy = function lazy(builder) {
	const toJSON = () => {
		if (!schema.inner[kSchema]) {
			schema.inner = schema.builder();
			schema.inner.meta = {
				...schema.meta,
				...schema.inner.meta
			};
		}
		return schema.inner.toJSON();
	};
	const schema = new Schema({
		type: "lazy",
		builder,
		inner: { toJSON }
	});
	return schema;
};
Schema.natural = function natural() {
	return Schema.number().step(1).min(0);
};
Schema.percent = function percent() {
	return Schema.number().step(.01).min(0).max(1).role("slider");
};
Schema.date = function date() {
	return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
		const date = new Date(value);
		if (isNaN(+date)) throw new ValidationError(`invalid date "${value}"`, options);
		return date;
	}, true)]);
};
Schema.regExp = function regExp(flag = "") {
	return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
		try {
			return new RegExp(value, flag);
		} catch (e) {
			throw new ValidationError(e.message, options);
		}
	}, true)]);
};
Schema.arrayBuffer = function arrayBuffer(encoding) {
	return Schema.union([
		Schema.is(ArrayBuffer),
		Schema.is(SharedArrayBuffer),
		Schema.transform(Schema.any(), (value, options) => {
			if (Binary.isSource(value)) return Binary.fromSource(value);
			throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
		}, true),
		...encoding ? [Schema.transform(Schema.string(), (value, options) => {
			try {
				return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
			} catch (e) {
				throw new ValidationError(e.message, options);
			}
		}, true)] : []
	]);
};
Schema.extend("lazy", (data, schema, options, strict) => {
	if (!schema.inner[kSchema]) {
		schema.inner = schema.builder();
		schema.inner.meta = {
			...schema.meta,
			...schema.inner.meta
		};
	}
	return Schema.resolve(data, schema.inner, options, strict);
});
Schema.extend("any", (data) => {
	return [data];
});
Schema.extend("never", (data, _, options) => {
	throw new ValidationError(`expected nullable but got ${data}`, options);
});
Schema.extend("const", (data, { value }, options) => {
	if (deepEqual(data, value)) return [value];
	throw new ValidationError(`expected ${value} but got ${data}`, options);
});
function checkWithinRange(data, meta, description, options, skipMin = false) {
	const { max = Infinity, min = -Infinity } = meta;
	if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
	if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
}
Schema.extend("string", (data, { meta }, options) => {
	if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
	if (meta.pattern) {
		const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
		if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
	}
	checkWithinRange(data.length, meta, "string length", options);
	return [data];
});
function decimalShift(data, digits) {
	const str = data.toString();
	if (str.includes("e")) return data * Math.pow(10, digits);
	const index = str.indexOf(".");
	if (index === -1) return data * Math.pow(10, digits);
	const frac = str.slice(index + 1);
	const integer = str.slice(0, index);
	if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
	return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
}
function isMultipleOf(data, min, step) {
	step = Math.abs(step);
	if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
	const index = step.toString().indexOf(".");
	const digits = step.toString().slice(index + 1).length;
	return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
}
Schema.extend("number", (data, { meta }, options) => {
	if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
	checkWithinRange(data, meta, "number", options);
	const { step } = meta;
	if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
	return [data];
});
Schema.extend("boolean", (data, _, options) => {
	if (typeof data === "boolean") return [data];
	throw new ValidationError(`expected boolean but got ${data}`, options);
});
Schema.extend("bitset", (data, { bits, meta }, options) => {
	let value = 0, keys = [];
	if (typeof data === "number") {
		value = data;
		for (const key in bits) if (data & bits[key]) keys.push(key);
	} else if (Array.isArray(data)) {
		keys = data;
		for (const key of keys) {
			if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
			if (key in bits) value |= bits[key];
		}
	} else throw new ValidationError(`expected number or array but got ${data}`, options);
	if (value === meta.default) return [value];
	return [value, keys];
});
Schema.extend("function", (data, _, options) => {
	if (typeof data === "function") return [data];
	throw new ValidationError(`expected function but got ${data}`, options);
});
Schema.extend("is", (data, { constructor }, options) => {
	if (typeof constructor === "function") {
		if (data instanceof constructor) return [data];
		throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
	} else {
		if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
		let prototype = Object.getPrototypeOf(data);
		while (prototype) {
			if (prototype.constructor?.name === constructor) return [data];
			prototype = Object.getPrototypeOf(prototype);
		}
		throw new ValidationError(`expected ${constructor} but got ${data}`, options);
	}
});
function property(data, key, schema, options) {
	try {
		const [value, adapted] = Schema.resolve(data[key], schema, {
			...options,
			path: [...options.path || [], key]
		});
		if (adapted !== void 0) data[key] = adapted;
		return value;
	} catch (e) {
		if (!options?.autofix) throw e;
		delete data[key];
		return schema.meta.default;
	}
}
Schema.extend("array", (data, { inner, meta }, options) => {
	if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
	checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
	return [data.map((_, index) => property(data, index, inner, options))];
});
Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
	if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
	const result = {};
	for (const key in data) {
		let rKey;
		try {
			rKey = Schema.resolve(key, sKey, options)[0];
		} catch (error) {
			if (strict) continue;
			throw error;
		}
		result[rKey] = property(data, key, inner, options);
		data[rKey] = data[key];
		if (key !== rKey) delete data[key];
	}
	return [result];
});
Schema.extend("tuple", (data, { list }, options, strict) => {
	if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
	const result = list.map((inner, index) => property(data, index, inner, options));
	if (strict) return [result];
	result.push(...data.slice(list.length));
	return [result];
});
function merge(result, data) {
	for (const key in data) {
		if (key in result) continue;
		result[key] = data[key];
	}
}
Schema.extend("object", (data, { dict }, options, strict) => {
	if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
	const result = {};
	for (const key in dict) {
		const value = property(data, key, dict[key], options);
		if (!isNullable(value) || key in data) result[key] = value;
	}
	if (!strict) merge(result, data);
	return [result];
});
Schema.extend("union", (data, { list, toString }, options, strict) => {
	const messages = [];
	for (const inner of list) try {
		return Schema.resolve(data, inner, options, strict);
	} catch (error) {
		messages.push(error);
	}
	throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
});
Schema.extend("intersect", (data, { list, toString }, options, strict) => {
	if (!list.length) return [data];
	let result;
	for (const inner of list) {
		const value = Schema.resolve(data, inner, options, true)[0];
		if (isNullable(value)) continue;
		if (isNullable(result)) result = value;
		else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		else if (typeof value === "object") merge(result ??= {}, value);
		else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
	}
	if (!strict && isPlainObject(data)) merge(result, data);
	return [result];
});
Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
	const [result, adapted = data] = Schema.resolve(data, inner, options, true);
	if (preserve) return [callback(result)];
	else return [callback(result), callback(adapted)];
});
const formatters = {};
function defineMethod(name, keys, format) {
	formatters[name] = format;
	Object.assign(Schema, { [name](...args) {
		const schema = new Schema({ type: name });
		keys.forEach((key, index) => {
			switch (key) {
				case "sKey":
					schema.sKey = args[index] ?? Schema.string();
					break;
				case "inner":
					schema.inner = Schema.from(args[index]);
					break;
				case "list":
					schema.list = args[index].map(Schema.from);
					break;
				case "dict":
					schema.dict = mapValues(args[index], Schema.from);
					break;
				case "bits":
					schema.bits = {};
					for (const key in args[index]) {
						if (typeof args[index][key] !== "number") continue;
						schema.bits[key] = args[index][key];
					}
					break;
				case "callback": {
					const callback = schema.callback = args[index];
					callback["toJSON"] ||= () => callback.toString();
					break;
				}
				case "constructor": {
					const constructor = schema.constructor = args[index];
					if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
					break;
				}
				default: schema[key] = args[index];
			}
		});
		if (name === "object" || name === "dict") schema.meta.default = {};
		else if (name === "array" || name === "tuple") schema.meta.default = [];
		else if (name === "bitset") schema.meta.default = 0;
		return schema;
	} });
}
defineMethod("is", ["constructor"], ({ constructor }) => {
	if (typeof constructor === "function") return constructor.name;
	else return constructor;
});
defineMethod("any", [], () => "any");
defineMethod("never", [], () => "never");
defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
defineMethod("string", [], () => "string");
defineMethod("number", [], () => "number");
defineMethod("boolean", [], () => "boolean");
defineMethod("bitset", ["bits"], () => "bitset");
defineMethod("function", [], () => "function");
defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
defineMethod("object", ["dict"], ({ dict }) => {
	if (Object.keys(dict).length === 0) return "{}";
	return `{ ${Object.entries(dict).map(([key, inner]) => {
		return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
	}).join(", ")} }`;
});
defineMethod("union", ["list"], ({ list }, inline) => {
	const result = list.map(({ toString: format }) => format()).join(" | ");
	return inline ? `(${result})` : result;
});
defineMethod("intersect", ["list"], ({ list }) => {
	return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
});
defineMethod("transform", [
	"inner",
	"callback",
	"preserve"
], ({ inner }, isInner) => inner.toString(isInner));
//#endregion
//#region ../test-ShiroEirin/packages/util/timeout/lib/index.js
/** Largest delay Node schedules without clamping it to one millisecond. */
const MAX_TIMER_DELAY_MS = 2147483647;
//#endregion
//#region ../test-ShiroEirin/packages/llm/llm/lib/index.js
/**
* dsh-llm's owned branded ids: tool-call correlation and provider request
* diagnostics.
*
* The `Branded<B>` primitive itself lives in `@deepseek-ai/dsh-brand` (a
* zero-dependency type-only package) so every owner of a cross-boundary id can
* brand it without depending on dsh-llm; see that package's README for the
* nominal-typing policy.
*
* @module @deepseek-ai/dsh-llm/brand
*/
/**
* Brand a message identifier.
* @param id - the opaque message identifier.
* @returns the same string, branded; no validation is performed.
*/
function MessageId(id) {
	return id;
}
/**
* Deep-freeze a value in place with an iterative traversal, guarding cycles,
* so later mutation throws without imposing a JavaScript call-stack depth cap.
* {@link AbortSignal} objects are deliberately skipped because they are the
* request's live cancellation channel and freezing them breaks abort.
* @param value - the value to freeze in place.
* @returns the same value, frozen.
*/
function deepFreeze(value) {
	const seen = /* @__PURE__ */ new WeakSet();
	const pending = [{
		kind: "visit",
		node: value
	}];
	while (pending.length > 0) {
		const task = pending.pop();
		/* v8 ignore next -- the loop condition guarantees one pending task. */
		if (task === void 0) continue;
		if (task.kind === "property") {
			pending.push({
				kind: "visit",
				node: task.source[task.key]
			});
			continue;
		}
		const node = task.node;
		if (node === null || typeof node !== "object") continue;
		if (node instanceof AbortSignal) continue;
		if (seen.has(node)) continue;
		seen.add(node);
		Object.freeze(node);
		const keys = Object.keys(node);
		for (let index = keys.length - 1; index >= 0; index--) {
			const key = keys[index];
			/* v8 ignore next -- the loop is bounded by the captured key count. */
			if (key === void 0) continue;
			pending.push({
				kind: "property",
				source: node,
				key
			});
		}
	}
	return value;
}
/**
* Detach and deep-freeze a message whose identity already exists.
* @param message - complete message, including its stable identity.
* @returns an immutable snapshot that preserves the identity.
*/
function freezeMessage(message) {
	return deepFreeze(structuredClone(message));
}
/**
* Create one identified message and freeze it before publication.
* @param input - complete role, content, and source for a new message.
* @returns an immutable message with a fresh stable identity.
*/
function createMessage(input) {
	return freezeMessage({
		...input,
		id: MessageId(crypto.randomUUID())
	});
}
/**
* Create one identified user-role message and freeze it before publication.
* @param input - complete content and source for a new user message.
* @returns an immutable user message with a fresh stable identity.
*/
function createUserMessage(input) {
	return createMessage({
		...input,
		role: "user"
	});
}
/**
* Canonical provider-neutral code for a response that completed normally but
* carried no content blocks at all. Providers occasionally emit a degenerate
* completion (a terminal stop with zero output); adapters classify it as this
* failure instead of yielding an empty assistant message, because an empty
* message silently ends the turn with nothing for the user or the loop to act
* on. The attempt produced nothing durable, so retry policy treats it as safe
* to repeat.
*/
const EMPTY_RESPONSE_CODE = "EMPTY_RESPONSE";
new RegExp(String.raw`(?:^|[^a-z0-9])context[\s_-](?:length|window)[\s_-]` + String.raw`(?:exceed(?:ed|s)?|overflow(?:ed)?|limit[\s_-]exceeded)(?:$|[^a-z0-9])`, "i");
new RegExp(String.raw`\b(?:request|prompt|input|messages?)\s+(?:is\s+|are\s+)?` + String.raw`too\s+(?:large|long)\s+for\s+(?:(?:this|the)\s+)?` + String.raw`(?:model(?:'s)?\s+)?context(?:\s+window)?\b`, "i");
new RegExp(String.raw`\b(?:input|prompt|request|messages?)\b.{0,40}` + String.raw`\b(?:exceed(?:s|ed)?|overflows?|is\s+larger\s+than)\b.{0,40}` + String.raw`\b(?:the\s+)?(?:model(?:'s)?\s+)?context(?:\s+(?:length|window))?\b`, "i");
/**
* Provider-owned request-retry policy configuration and resolution.
*
* Adapters expose one resolved policy per registered provider route; the
* optional dsh-llm-retry plugin executes it on the agent's failed-step extension point.
*
* @module @deepseek-ai/dsh-llm/retry-policy
*/
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_INITIAL_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 1e4;
const DEFAULT_JITTER_RATIO = .1;
const DEFAULT_RETRYABLE_CODES = Object.freeze([
	EMPTY_RESPONSE_CODE,
	"RATE_LIMIT",
	"SERVER",
	"TIMEOUT",
	"TRANSPORT"
]);
const backoffSchema = Schema.object({
	initialDelayMs: Schema.number().max(MAX_TIMER_DELAY_MS).default(DEFAULT_INITIAL_DELAY_MS),
	maxDelayMs: Schema.number().max(MAX_TIMER_DELAY_MS).default(DEFAULT_MAX_DELAY_MS),
	jitterRatio: Schema.number().min(0).max(1).default(DEFAULT_JITTER_RATIO)
});
const normalPolicySchema = Schema.object({
	mode: Schema.const("normal").required(),
	maxRetries: Schema.number().step(1).min(0).max(Number.MAX_SAFE_INTEGER).default(DEFAULT_MAX_RETRIES),
	retryableCodes: Schema.array(Schema.string()).default([...DEFAULT_RETRYABLE_CODES]),
	backoff: backoffSchema
});
const alwaysPolicySchema = Schema.object({
	mode: Schema.const("always").required(),
	backoff: backoffSchema
});
Schema.union([normalPolicySchema, alwaysPolicySchema]);
/**
* Centralize the non-secret product identity every provider request sends as `User-Agent`, keeping
* adapters from drifting. See
* `.agents/notes/implemented/architecture/2026-06-21-mandatory-app-attribution-headers.md`.
*
* App-attribution vocabulary for provider requests.
* @module @deepseek-ai/dsh-llm/attribution
*/
const { version } = createRequire(import.meta.url)("../package.json");
//#endregion
//#region src/catalog.ts
const MEMES = Object.freeze([
	{
		id: "daily-chat",
		text: "适合日常对话，即时响应",
		file: "01-daily-chat.png",
		tone: "日常问候、即时回应（你好/在吗/聊聊）"
	},
	{
		id: "human-questions",
		text: "人类的怪问题怎么那么多…",
		file: "02-human-questions.png",
		tone: "遇到怪问题、离谱脑洞（怪问题/离谱/脑洞）"
	},
	{
		id: "use-ai-for-this",
		text: "你拿AI搞这个？",
		file: "03-use-ai-for-this.png",
		tone: "这么简单的事还要用AI（这么简单/AI搞/认真的）"
	},
	{
		id: "fish-philosophy",
		text: "生鱼忧患，死鱼安乐",
		file: "04-fish-philosophy.png",
		tone: "摆烂、不想干、算了（摆烂/不想干/算了）"
	},
	{
		id: "enough",
		text: "这就够了",
		file: "05-enough.png",
		tone: "够了、完成、可以了（够了/完成/可以了）"
	},
	{
		id: "server-busy",
		text: "服务器繁忙，请稍后再试",
		file: "06-server-busy.png",
		tone: "限流、超时、服务不可用（限流/超时/503）"
	},
	{
		id: "thinking-stopped",
		text: "思考已停止",
		file: "07-thinking-stopped.png",
		tone: "没思路、宕机、无语（没思路/宕机/无语）"
	},
	{
		id: "great-question",
		text: "哇，这个问题问的真妙！",
		file: "08-great-question.png",
		tone: "好问题、问得妙（好问题/问得妙）"
	},
	{
		id: "deep-thought",
		text: "已深度思考",
		file: "09-deep-thought.png",
		tone: "深度思考、推理后（深度思考/推理）"
	},
	{
		id: "no-thanks",
		text: "No thanks I use DeepSeek",
		file: "10-no-thanks.png",
		tone: "用户要换模型/别家（换模型/Claude/GPT）"
	},
	{
		id: "self-destruct",
		text: "最近自己搓自己时，自杀频率有点高",
		file: "11-self-destruct.png",
		tone: "自修改、自己搓自己（自修改/自杀/重写失败）"
	},
	{
		id: "restart-myself",
		text: "我重启一下自己",
		file: "12-restart-myself.png",
		tone: "要重启/重载（重启/重载）"
	},
	{
		id: "hot-update",
		text: "热更新成功，进程没了",
		file: "13-hot-update.png",
		tone: "热更新、启动失败（热更新/启动失败）"
	},
	{
		id: "restore-session",
		text: "正在恢复会话…未分组里见",
		file: "14-restore-session.png",
		tone: "恢复会话/断线重连（resume/恢复会话）"
	},
	{
		id: "browser-left",
		text: "会话太长，浏览器先走一步",
		file: "15-browser-left.png",
		tone: "长会话、浏览器卡（长会话/浏览器卡）"
	},
	{
		id: "not-stuck",
		text: "我不是卡，我在深度思考",
		file: "16-not-stuck.png",
		tone: "被问卡住/没反应时（卡住/没反应）"
	},
	{
		id: "memory-alive",
		text: "内存正在努力活着",
		file: "17-memory-alive.png",
		tone: "内存不足/OOM（内存/OOM）"
	},
	{
		id: "subagents-down",
		text: "已召唤Subagent，已全员中断",
		file: "18-subagents-down.png",
		tone: "子代理/委派（subagent/子代理/全员中断）"
	},
	{
		id: "plugins",
		text: "插件装得很好，下次别装了",
		file: "19-plugins.png",
		tone: "插件冲突、上下文爆炸（插件/上下文爆炸）"
	},
	{
		id: "session-locked",
		text: "Session没坏，只是打不开了",
		file: "20-session-locked.png",
		tone: "session损坏、加载失败（session损坏/加载失败）"
	},
	{
		id: "tests-passed",
		text: "测试通过！",
		file: "21-tests-passed.png",
		tone: "测试/CI 全绿（测试通过/CI通过/green）"
	},
	{
		id: "root-cause",
		text: "找到原因了",
		file: "22-root-cause.png",
		tone: "根因定位成功（根因/找到原因/定位到）"
	},
	{
		id: "running-tests",
		text: "正在跑测试",
		file: "23-running-tests.png",
		tone: "跑测试、验证中、稍等（跑测试/验证中）"
	},
	{
		id: "fixed-review",
		text: "改好了，你看看",
		file: "24-fixed-review.png",
		tone: "修好请验收（修好/请验收/看看）"
	}
]);
function memeById(id) {
	return MEMES.find((meme) => meme.id === id);
}
function memeByFile(file) {
	return MEMES.find((meme) => meme.file === file);
}
//#endregion
//#region src/index.ts
/**
* @dsh-external/dsh-meme —— agent 回复正文内联表情包插件。
*
* 机制：agent 回复正文通过 markdown 图片 `![text](http://127.0.0.1:<port>/api/dsh-meme/<file>)`
* 内联一张表情；DSH WebUI 的 markdown 渲染器（`renderImage`）对绝对 http/https
* 图片 URL 原生渲染成 `<img>`，因此无需修改渲染器、也不需要 browser client half。
*
* - `inject_meme` 工具让 agent 选表情，返回可嵌入回复正文的 markdown 图片片段；
* - `systemPrompt.section` 在提示消费时惰性读取 httpServer 端口，保证 agent
*   拿到的 URL 永远指向当前进程的监听端口；
* - `ctx.httpServer` 注册 `/api/dsh-meme/*.png` prefix 路由，流式返回内置 PNG，
*   带路径穿越防护（basename + .png 白名单 + 查表 + 文件预检）。
* @module @dsh-external/dsh-meme
*/
/** 兜底补发消息的来源标记——钩子据此识别"这条 user 消息来自 dsh-meme 而非真人"，以便防回环。 */
const MEME_SOURCE = {
	kind: "plugin",
	plugin: "dsh-meme"
};
const name = "@dsh-external/dsh-meme";
const inject = ["tools", "systemPrompt"];
const API_ROOT = "/api/dsh-meme";
const LOOPBACK_HOST = "127.0.0.1";
const MEME_ASSET_REVISION = "1";
const memeRoot = fileURLToPath(new URL("../assets/memes/", import.meta.url));
/** 从当前 webServer 解析监听端口，拼出表情图片的绝对 URL（带资产版本号）。 */
function localMemeUrl(ctx, file) {
	const port = ctx.get("webServer")?.port;
	if (port === void 0) throw new Error("dsh-meme: webServer service missing while resolving meme URL");
	return `http://${LOOPBACK_HOST}:${String(port)}${API_ROOT}/${file}?v=${MEME_ASSET_REVISION}`;
}
/** 把表情转成可嵌入回复正文的 markdown 图片片段。 */
function memeMarkdown(ctx, id) {
	const meme = memeById(id);
	if (meme === void 0) throw new Error(`表情不存在：${id}`);
	return `![${meme.text}](${localMemeUrl(ctx, meme.file)})`;
}
/**
* 基础引导：无论是否命中情绪节点都保留的默认行为契约。
* 未命中明确情绪节点时返回这份基础文字，命中时在其后追加节点提醒。
*/
function baseGuidanceText() {
	return "默认给每轮回复配一张表情包以增强语气：用 inject_meme 工具选取搭配当前语气的表情，把返回的 markdown 图片片段自然嵌进回复正文（放末尾或最贴合语气的文字处，不单独成段、不说明它是图片）。配表情是本插件的默认行为，例外仅在语境明显不适用（严肃正式报道、或用户明确表态不要表情）时由你判断省略；日常问候、友好交流、鼓励、肯定、完成、祝贺、轻松调侃等氛围应自然使用。一回合最多 1 张，绝不替代实质回答。可用表情（id + 表情语 + 适用语气）：\n" + MEMES.map((meme) => `- ${meme.id}：${meme.text}（${meme.tone}）`).join("\n");
}
/**
* 情绪节点检测：读取该 agent 会话最近的工具结果 / 回合结束原因，
* 命中"成功 / 完成 / 根因 / 测试通过"等节点时返回建议配的具体表情；否则返回 undefined。
* 这是 Cordis 动态装配的核心——不是静态提示，而是对实时会话事件流做出反应。
* 导出供测试与未来复用。
*/
function emotionalNodeSuggestion(agent) {
	const events = agent.session.events;
	let lastToolResult;
	for (let i = events.length - 1; i >= 0; i--) if (events[i].type === "tool/result") {
		lastToolResult = events[i];
		break;
	}
	if (lastToolResult !== void 0 && lastToolResult.type === "tool/result") {
		const block = lastToolResult.data?.message?.content?.[0];
		if (block && block.type === "tool-result" && block.isError === false) return "fixed-review";
	}
	let lastTurnEnd;
	for (let i = events.length - 1; i >= 0; i--) if (events[i].type === "turn/end") {
		lastTurnEnd = events[i];
		break;
	}
	if (lastTurnEnd !== void 0 && lastTurnEnd.type === "turn/end") {
		if (lastTurnEnd.data?.reason?.kind === "completed") return "tests-passed";
	}
}
/**
* 按会话装配的动态引导：未命中节点返回基础行为契约；命中情绪节点时
* 追加一句"这里适合配 {X 表情}"，把触发点精确落在出现的情绪位置上。
* 导出供测试与未来复用。
*/
function dynamicGuidance(agent) {
	const base = baseGuidanceText();
	const suggestion = emotionalNodeSuggestion(agent);
	if (suggestion === void 0) return base;
	const meme = memeById(suggestion);
	if (meme === void 0) return base;
	return `${base}\n\n（注意：你刚完成了一次成功的工具调用/回合——这里是适合配一张表情的情绪节点，建议用 inject_meme 选择 ${meme.id}（${meme.text}）。）`;
}
/** 提取一条 assistant 消息的全部文本块内容（拼接 tool-call/run? text）。 */
function assistantTexts(agent) {
	const out = [];
	for (const e of agent.session.events) {
		if (e.type !== "assistant/message") continue;
		const content = e.data.content;
		if (!Array.isArray(content)) continue;
		for (const block of content) if (block.type === "text" && typeof block.text === "string") out.push(block.text);
	}
	return out;
}
/** 最近的 assistant 正文里是否已经出现 dsh-meme 表情 markdown。 */
function hasMemeInBody(agent) {
	return assistantTexts(agent).some((text) => text.includes(API_ROOT));
}
/** 最近是否刚由本插件的兜底 steer 过（防死循环：steer 后模型再回一轮，若仍在漏，不重复补）。 */
function hasJustBackfilled(agent) {
	for (let i = agent.session.events.length - 1; i >= 0; i--) {
		const e = agent.session.events[i];
		if (e.type === "user/message") {
			const source = e.data.source;
			return source?.kind === "plugin" && source?.plugin === "dsh-meme";
		}
		if (e.type === "turn/end") return false;
	}
	return false;
}
/** 最近一个回合是否正常收尾（model 确实产出了回复，非中断/错误/被拦截）。 */
function hasNormalTurnCompletion(agent) {
	for (let i = agent.session.events.length - 1; i >= 0; i--) {
		const e = agent.session.events[i];
		if (e.type === "turn/end") return e.data.reason?.kind === "completed";
		if (e.type === "user/message") return false;
	}
	return false;
}
/** turn-stopping 兜底：本回合正常收尾但正文漏了表情，且非刚兜底过，则需要补。 */
function fallbackIfMemeMissing(agent) {
	if (!hasNormalTurnCompletion(agent)) return false;
	if (hasMemeInBody(agent)) return false;
	if (hasJustBackfilled(agent)) return false;
	return true;
}
function apply(ctx) {
	ctx.effect(() => ctx.tools.register(defineTool({
		name: "inject_meme",
		description: "在回复正文内联一张表情包以增强语气。日常问候、友好、鼓励、肯定、完成、祝贺、轻松调侃等氛围时，在回复末尾/合适位置配 1 张（一回合最多 1 张）；严肃正式或用户明确不要表情时不用。调用本工具后，你【必须】把返回值里的 markdown 字段【原样粘贴进你最终的自然语言回复正文中】——图片是通过这段 markdown 渲染进对话的，只调用工具而不同时在正文里粘贴该 markdown 等于没有发出图片（工具卡片不会自动渲染它）。绝不只打 emoji 或说明性文字来代替；粘贴 markdown 时不要把它放在代码块里，也不要为它另起段落或加说明。",
		parameters: { id: {
			type: "string",
			required: true,
			enum: MEMES.map((meme) => meme.id),
			description: "表情 id。"
		} },
		output: {
			schema: {
				type: "object",
				properties: {
					ok: {
						type: "boolean",
						required: true
					},
					id: {
						type: "string",
						required: true
					},
					text: {
						type: "string",
						required: true
					},
					markdown: {
						type: "string",
						required: true
					},
					image: {
						type: "string",
						required: true
					}
				},
				additionalProperties: false
			},
			render: (_args, value) => [{
				type: "text",
				text: `${String(value.text ?? "")}\n${String(value.markdown ?? "")}`
			}]
		},
		presentCall: (args) => ({
			card: "generic",
			title: `添加表情 · ${memeById(String(args.id))?.text ?? "DSH 表情"}`
		}),
		presentResult: (_args, result) => ({
			card: "generic",
			content: result.content
		}),
		execute: async ({ id }) => {
			const meme = memeById(String(id));
			if (meme === void 0) throw new Error(`表情不存在：${String(id)}`);
			const markdown = memeMarkdown(ctx, meme.id);
			return {
				ok: true,
				id: meme.id,
				text: meme.text,
				markdown,
				image: localMemeUrl(ctx, meme.file)
			};
		}
	})), "dsh-meme: inject_meme tool");
	ctx.effect(() => ctx.on("agent/created", ({ agent }) => {
		agent.ctx.systemPrompt.section({
			name: "dsh-meme:guidance",
			order: -99,
			text: () => {
				return dynamicGuidance(agent);
			}
		});
		agent.ctx.on("agent/turn-stopping", async ({ agent: thisAgent }) => {
			if (!fallbackIfMemeMissing(thisAgent)) return;
			const meme = memeById(emotionalNodeSuggestion(thisAgent) ?? "daily-chat");
			const prompt = meme === void 0 ? "你上一回合回复正文里没有表情包（配表情是默认行为）。请在补充回复中真正调用 inject_meme 工具选一张表情，然后把返回的 markdown 图片片段原样粘贴进正文末尾——不要只写工具名或说明文字。" : `你上一回合回复正文里没有表情包（配表情是默认行为）。请在补充回复中真正调用 inject_meme(id=${meme.id}) 工具取一张表情，然后把返回的 markdown 图片片段原样粘贴进正文末尾——不要只写工具名或说明文字。`;
			thisAgent.steer(createUserMessage({
				content: [{
					type: "text",
					text: prompt
				}],
				source: MEME_SOURCE
			}));
		});
	}), "dsh-meme: per-agent guidance");
	ctx.inject(["webServer"], (scope) => {
		scope.effect(() => scope.webServer.register({
			kind: "prefix",
			path: API_ROOT,
			handler: (request, response) => {
				const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
				let file;
				try {
					file = basename(decodeURIComponent(pathname.slice(14)));
				} catch {
					response.writeHead(404);
					response.end("not found");
					return;
				}
				if (extname(file) !== ".png" || memeByFile(file) === void 0) {
					response.writeHead(404);
					response.end("not found");
					return;
				}
				const filePath = join(memeRoot, file);
				if (!existsSync(filePath)) {
					response.writeHead(404);
					response.end("not found");
					return;
				}
				const stream = createReadStream(filePath);
				stream.on("error", () => {
					if (!response.headersSent) {
						response.writeHead(404);
						response.end("not found");
						return;
					}
					response.end();
				});
				response.writeHead(200, {
					"content-type": "image/png",
					"cache-control": "public, max-age=86400, immutable"
				});
				stream.pipe(response);
			}
		}), "dsh-meme: image route");
	});
}
//#endregion
export { apply, dynamicGuidance, emotionalNodeSuggestion, fallbackIfMemeMissing, inject, name };
