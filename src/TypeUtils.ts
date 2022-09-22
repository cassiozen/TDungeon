// Credits: Adapted from @devanshj's work on TXState (https://github.com/devanshj/txstate)

/**
 * Casts a type (unless it's already narrower)
 * @example
 * // returns 'hey'
 * Cast<'hey', string>
 * @example
 * // returns string
 * Cast<unknown, string>
 */
export type Cast<TType, TBroadType> = TType extends TBroadType ? TType : TBroadType;

/**
 * Gets a subtype of a collection type (object, array, tuple)
 * @example
 * Get<{name: string, pronoums: ['they','them']}, 'pronoums'> //['they','them']
 *
 * You can also get within a nested collection by passing a tuple
 * @example
 * Get<{user: { name: string, pronoums: ['they','them']}}, ['user', 'pronoums', 0]> //'they'
 */
export type Get<TCollection, TKeys, TFallback = undefined> = TKeys extends any[]
  ? TKeys extends []
    ? TCollection extends undefined
      ? TFallback
      : TCollection
    : TKeys extends [infer K1, ...infer Kr]
    ? K1 extends keyof TCollection
      ? Get<TCollection[K1], Kr, TFallback> extends infer X
        ? Cast<X, any>
        : never
      : TFallback
    : never
  : Get<TCollection, [TKeys], TFallback>;

/**
 * Compares if two types A and B are equal. 
 * @returns type literal 'true' or 'false'
 */
export type AreEqual<A, B> = (<T>() => T extends B ? 1 : 0) extends <T>() => T extends A ? 1 : 0 ? true : false;

/**
 * Checks if type A extends type B. 
 * @returns type literal 'true' or 'false'
 */
export type DoesExtend<A, B> = A extends B ? true : false;

/**
 * Checks if a type is an plain object (not a function)
 * @returns type literal 'true' or 'false'
 */
export type IsPlainObject<TType> = Bool.And<DoesExtend<TType, A.Object>, Bool.Not<DoesExtend<TType, A.Function>>>;

export namespace A {
  /**
   * Aliases for common generic types
   */
  export type Function = (...args: any[]) => any;
  export type Tuple<T = any> = T[] | [T];
  export type TupleOrUnit<T> = T | Tuple<T>;
  export type Object = object;
  export type String = string;
  export type Number = number;
  export type Universal = string | number | boolean | undefined | null | bigint | object | ((...a: any[]) => any);
}

export namespace Obj {
  /**
   * Object Type utilities
   */

  /**
  * Casts TType to object type
  */
  export type Assert<TType> = Cast<TType, A.Object>;

  /**
  * Apply readonly recursively
  */
  export type DeepReadonly<TObj> = {
    readonly [TKey in keyof TObj]: TObj[TKey] extends any
      ? TObj[TKey] extends A.Function
        ? TObj[TKey]
        : TObj[TKey] extends A.Object
        ? DeepReadonly<TObj[TKey]>
        : TObj[TKey]
      : never;
  };

  /**
  * Returns the keys in TObj whose type matches TValueType
  * @example
  * KeyWithValue<{name: string, age: number}, number> //"age"
  */
  export type KeyWithValue<TObj, TValueType> = {
    [Key in keyof TObj]: TObj[Key] extends TValueType ? Key : never;
  }[keyof TObj];

  /**
  * Returns an object with all its keys and values.
  * Can be used as a "trick" to force Typescript to express
  * an union of objects as a merged object.
  * @example
  * type T = {name: string} & {age: number} //{name: string} & {age: number}
  * Mergify<T> //{name: string, age: number}
  */
  export type Mergify<TObj> = {
    [Key in keyof TObj]: TObj[Key];
  } & unknown; // Addind `& unknown` forces TS to "resolve" the type

  /**
  * Updates the type of a given key within an object type
  * @example
  * type T = {name: string, age: string} //{name: string, age: string}
  * Update<T, {age: number}> //{name: string, age: number}
  */
  export type Update<A, B> = Mergify<
    {
      [K in Union.Exclude<keyof A, keyof B>]: A[K];
    } & {
      [K in keyof B]: B[K];
    }
  >;
}

export namespace List {
  /**
   * Array and Tuple Type utilities
   */

  /**
  * Casts TType to tuple type
  */
  export type Assert<TType> = Cast<TType, A.Tuple>;

  /**
  * Concatenate two tuple types A and B
  */
  export type Concat<A, B> = [...List.Assert<A>, ...List.Assert<B>];

  /**
  * Returns a new tuple type with type TType pushed into tuple type TTuple
  * @example
  * Pushed<[string, string], number> //[string, string, number]
  */
  export type Pushed<TTuple, TType> = [...List.Assert<TTuple>, TType];

  /**
  * Returns a new tuple type with the last type removed from TTuple
  * @example
  * Popped<[string, string, number]> //[string, string]
  */
  export type Popped<TTuple> = TTuple extends [] ? [] : TTuple extends [...infer Popped, any] ? Popped : never;

  /**
  * Returns the last type from tuple TTuple
  * @example
  * Pop<[string, string, number]> //number
  */
  export type Pop<TTuple> = TTuple extends []
    ? undefined
    : TTuple extends [...List.Popped<TTuple>, infer X]
    ? X
    : never;

  /**
  * Returns a new tuple type with the first type removed from TTuple
  * @example
  * Shifted<[string, string, number]> //[string, number]
  */
  export type Shifted<TTuple> = TTuple extends [] ? [] : TTuple extends [any, ...infer Shifted] ? Shifted : never;

  /**
  * Returns a new tuple type with the type TItem added to beginning of TTuple
  * @example
  * Unshift<["Buy Milk", "Buy Eggs"], "Learn Typescript"> //["Learn Typescript", "Buy Milk", "Buy Eggs"]
  */
  export type Unshift<TTuple, TItem> = [TItem, ...List.Assert<TTuple>];

  /**
  * Returns the first type from tuple TTuple
  * @example
  * Shift<[string, string, number]> //string
  */
  export type Shift<TTuple> = TTuple extends [] ? undefined : TTuple extends [infer X, ...infer _] ? X : never;

  /**
  * Concatenate multiple tuples
  * @example
  * ConcatAll<[[string, number], [boolean], [10]]> //[string, number, boolean, 10]
  */
  export type ConcatAll<TTuples> = TTuples extends []
    ? []
    : TTuples extends [infer A]
    ? A
    : TTuples extends [infer A, infer B, ...infer X]
    ? ConcatAll<[List.Concat<A, B>, ...X]>
    : never;

  /**
  * Joins a tuple type TTuple into a string literal or template literal
  * @example
  * Join<['Chocolate', 'Strawberry'], ', '> //"Chocolate, Strawberry"
  * @example
  * Join<[string, number], ', '> //`${string}, ${number}`
  */
  export type Join<TTuple, TDelimeter> = TTuple extends []
    ? ""
    : TTuple extends [infer H, ...infer T]
    ? T extends []
      ? H
      : `${Str.Assert<H>}${Str.Assert<TDelimeter>}${Join<T, TDelimeter>}`
    : string;

  /**
  * Checks if tuple type TTuple includes type TValue. Returns the type literal 'true' or 'false'
  * @example
  * Includes<[1,2,3], 2> //true
  */
  export type Includes<TTuple, TValue> = TTuple extends [] ? false : TValue extends Get<TTuple, number> ? true : false;

  /**
  *  Returns a new tuple type with the type TValue filtered out
  * @example
  * Filter<[10,20,30], 20> //[10, 30]
  */
  export type Filter<TTuple, TValue> = TTuple extends []
    ? []
    : TTuple extends [infer H, ...infer T]
    ? H extends TValue
      ? Filter<T, TValue>
      : [H, ...Filter<T, TValue>]
    : never;
}

export namespace Union {
  /**
   * Union type utilities
   */

  /**
  * Checks if type is an union. 
  * @returns type literal 'true' or 'false'
  * @example
  * IsUnit<'hello'> //false
  * @example
  * IsUnit<'hello' | 'goodbye'> //true
  */
  export type IsUnit<T> = [Union.Popped<T>] extends [never] ? true : false;

  /**
  * Returns a new type with the last type removed from union TUnion
  * @example
  * Popped<'morning' | 'afternoon' | 'night'> //'morning' | 'afternoon'
  */
  export type Popped<TUnion> = Union.Exclude<TUnion, Union.Pop<TUnion>>;

  /**
  * Returns a new type with the type TValue excluded from union TUnion
  * @example
  * Exclude<'morning' | 'afternoon' | 'night', 'morning'> //'afternoon' | 'night'
  */
  export type Exclude<TUnion, TValue> = TUnion extends TValue ? never : TUnion;

  /**
  * Returns a new type with the type TValue extracted from union TUnion
  * @example
  * Extract<'morning' | 'afternoon' | 'night', 'morning'> //'morning'
  */
  export type Extract<TUnion, TValue> = TUnion extends TValue ? TUnion : never;

  /**
  * Returns the last type from tuple TTuple
  * @example
  * Pop<'clubs' | 'diamonds' | 'hearts' | 'spades'> //'spades'
  */
  export type Pop<TUnion> = ToIntersection<TUnion extends unknown ? (x: TUnion) => void : never> extends (x: infer P) => void
    ? P
    : never;

  /**
  * Returns the intersection between types in an union
  * @example
  * ToIntersection<number | number> //number
  */
  export type ToIntersection<TUnion> = (TUnion extends unknown ? (k: TUnion) => void : never) extends (k: infer I) => void
    ? I
    : never;

  /**
  * Returns a tuple of all the types in the union
  * @example
  * ToTuple<'clubs' | 'diamonds' | 'hearts' | 'spades'> //["clubs", "diamonds", "hearts", "spades"]
  */
  export type ToTuple<TUnion> = [TUnion] extends [never]
    ? []
    : [...Union.ToTuple<Union.Popped<TUnion>>, Union.Pop<TUnion>];
}

export namespace Bool {
  /**
   * Boolean Type utilities
   */
  export type Not<B> = B extends true ? false : true;
  export type And<A, B> = AreEqual<Union.ToIntersection<Get<[A, B], number>>, true>;
}

export namespace Str {
  /**
   * String type utilities
   */

  /**
  * Casts TType to string type
  */
  export type Assert<TType> = Cast<TType, A.String>;

  /**
  * Checks if TType is a string literal. 
  * @returns the type literal 'true' or 'false'
  */
  export type IsLiteral<TType> = TType extends A.String ? (A.String extends TType ? false : true) : false;

  /**
  * Checks if string literal TString starts with TValue.
  * @example
  * DoesStartWith<'order status ticket', 'order'> //true
  * @example
  * DoesStartWith<'order status ticket', 'status'> //false
  */
  export type DoesStartWith<TString, TValue> = TString extends TValue
    ? true
    : TString extends `${Str.Assert<TValue>}${infer _}`
    ? true
    : false;

  /**
  * Checks if string literal TString contains TValue.
  * @example
  * DoesContain<'order status ticket', 'order'> //true
  * @example
  * Ex.: DoesContain<'order status ticket', 'status'> //true
  */
  export type DoesContain<TString, TValue> = TString extends TValue
    ? true
    : TString extends `${infer _}${Str.Assert<TValue>}${infer __}`
    ? true
    : false;

  /**
  * Splits a string literal type TString into a tuple using delimiter TDelimiter
  * @example
  * Split<"chocolate, strawberry, cherry, vanilla", ", "> // ["chocolate", "strawberry", "cherry", "vanilla"]
  */
  export type Split<TString, TDelimiter> = TString extends `${infer H}${Str.Assert<TDelimiter>}${infer T}`
    ? [H, ...Split<T, TDelimiter>]
    : [TString];

  /**
  * Given a string literal type TString, returns a new string literal replacing all occurencies of TWhat for TWith
  * @example
  * Replace<"Hello World", "World", "Universe"> // "Hello Universe"
  */
  export type Replace<TString, TWhat, TWith> = TString extends `${infer P}${Str.Assert<TWhat>}${infer S}`
    ? `${P}${Str.Assert<TWith>}${Replace<S, TWhat, TWith>}`
    : TString;

  /**
  * Returns a new string type with the first character removed from TString
  */
  export type Shifted<TString> = TString extends `${infer _}${infer T}` ? T : "";
}
export namespace Num {
  export type Assert<T> = Cast<T, A.Number>;
  export type PositiveIntegers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  export type NegativeIntegers = [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14, -15, -16, -17, -18, -19, -20];
  export type PositiveIntegersUnshifted = List.Unshift<PositiveIntegers, 0>;
  export type PositiveIntegersUnshiftedTwice = List.Unshift<PositiveIntegersUnshifted, -1>;
  export type NegativeIntegersUnshifted = List.Unshift<NegativeIntegers, 0>;
  export type NegativeIntegersUnshiftedTwice = List.Unshift<NegativeIntegersUnshifted, 1>;

  export type IsWhole<N> = Bool.Not<IsNegative<N>>;
  export type IsNegative<N> = Str.DoesStartWith<Num.ToString<N>, "-">;
  export type Negate<N> = N extends 0
    ? 0
    : IsNegative<N> extends true
    ? Num.FromString<Str.Shifted<Num.ToString<N>>>
    : Num.FromString<`-${Num.Assert<N>}`>;

  export type ToString<X> = `${Num.Assert<X>}`;
  export type FromString<S> = S extends "0"
    ? 0
    : Str.DoesStartWith<S, "-"> extends false
    ? {
        [I in keyof PositiveIntegersUnshifted]: I extends S ? PositiveIntegersUnshifted[I] : never;
      }[keyof PositiveIntegersUnshifted]
    : {
        [I in keyof NegativeIntegersUnshifted]: `-${Num.Assert<I>}` extends S ? NegativeIntegersUnshifted[I] : never;
      }[keyof NegativeIntegersUnshifted];

  export type Increment<N> = IsNegative<N> extends false
    ? Get<PositiveIntegers, N>
    : Get<NegativeIntegersUnshiftedTwice, Num.Negate<N>>;

  export type Decrement<N> = IsNegative<N> extends false
    ? Get<PositiveIntegersUnshiftedTwice, N>
    : Get<NegativeIntegers, Num.Negate<N>>;
}
