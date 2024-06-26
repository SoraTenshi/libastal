import Binding, { kebabify, type Connectable, type Subscribable } from "./binding.js"

export type Widget<C extends { new(...args: any): any }> = InstanceType<C> & {
    className: string
    css: string
    cursor: Cursor
    hook(
        object: Connectable,
        signal: string,
        callback: (self: Widget<C>, ...args: any[]) => void,
    ): Widget<C>
    hook(
        object: Subscribable,
        callback: (self: Widget<C>, ...args: any[]) => void,
    ): Widget<C>
}

export default function <G extends { Bin: any, Container: any, Widget: any }>(
    Gtk: G,
    setter: (prop: string) => `set${string}`,
    Astal: {
        cssSetter: (w: any, css: string) => void,
        cssGetter: (w: any) => string | null,
        classSetter: (w: any, name: string[]) => void,
        classGetter: (w: any) => string[],
        cursorSetter: (w: any, cursor: string) => void,
        cursorGetter: (w: any) => string | null,
    },
) {
    function hook(
        self: any,
        object: Connectable | Subscribable,
        signalOrCallback: string | ((self: any, ...args: any[]) => void),
        callback?: (self: any, ...args: any[]) => void,
    ) {
        if (typeof object.connect === "function" && callback) {
            const id = object.connect(signalOrCallback, (_: any, ...args: unknown[]) => {
                callback(self, ...args)
            })
            self.connect("destroy", () => {
                (object.disconnect as Connectable["disconnect"])(id)
            })
        }

        else if (typeof object.subscribe === "function" && typeof signalOrCallback === "function") {
            const unsub = object.subscribe((...args: unknown[]) => {
                signalOrCallback(self, ...args)
            })
            self.connect("destroy", unsub)
        }

        return self
    }

    function setChild(parent: any, child: any) {
        if (parent instanceof Gtk.Bin) {
            if (parent.get_child())
                parent.remove(parent.get_child()!)
        }
        if (parent instanceof Gtk.Container)
            parent.add(child)
    }

    function ctor(self: any, config: any, ...children: any[]) {
        const { setup, child, ...props } = config
        props.visible ??= true

        const bindings = Object.keys(props).reduce((acc: any, prop) => {
            if (props[prop] instanceof Binding) {
                const bind = [prop, props[prop]]
                prop === "child"
                    ? setChild(self, props[prop].get())
                    : self[setter(prop)](props[prop].get())

                delete props[prop]
                return [...acc, bind]
            }
            return acc
        }, [])

        const onHandlers = Object.keys(props).reduce((acc: any, key) => {
            if (key.startsWith("on")) {
                const sig = kebabify(key).split("-").slice(1).join("-")
                const handler = [sig, props[key]]
                delete props[key]
                return [...acc, handler]
            }
            return acc
        }, [])

        Object.assign(self, props)
        Object.assign(self, {
            hook(obj: any, sig: any, callback: any) {
                return hook(self, obj, sig, callback)
            },
        })

        if (child instanceof Binding) {
            setChild(self, child.get())
            self.connect("destroy", child.subscribe(v => {
                setChild(self, v)
            }))
        } else if (self instanceof Gtk.Container && child instanceof Gtk.Widget) {
            self.add(child)
        }

        for (const [signal, callback] of onHandlers)
            self.connect(signal, callback)

        if (self instanceof Gtk.Container && children) {
            for (const child of children)
                self.add(child)
        }

        for (const [prop, bind] of bindings) {
            self.connect("destroy", bind.subscribe((v: any) => {
                self[`${setter(prop)}`](v)
            }))
        }

        setup?.(self)
        return self
    }

    return function proxify<
        C extends { new(...args: any[]): any },
    >(klass: C) {
        Object.defineProperty(klass.prototype, "className", {
            get() { return Astal.classGetter(this).join(" ") },
            set(v) { Astal.classSetter(this, v.split(/\s+/)) },
        })

        Object.defineProperty(klass.prototype, "css", {
            get() { return Astal.cssGetter(this) },
            set(v) { Astal.cssSetter(this, v) },
        })

        Object.defineProperty(klass.prototype, "cursor", {
            get() { return Astal.cursorGetter(this) },
            set(v) { Astal.cursorSetter(this, v) },
        })

        const proxy = new Proxy(klass, {
            construct(_, [conf, ...children]) {
                const self = new klass
                return ctor(self, conf, ...children)
            },
            apply(_t, _a, [conf, ...children]) {
                const self = new klass
                return ctor(self, conf, ...children)
            },
        })

        return proxy
    }
}


type BindableProps<T> = {
    [K in keyof T]: Binding<NonNullable<T[K]>> | T[K];
}

export type ConstructProps<
    Self extends { new(...args: any[]): any },
    Props = unknown,
    Signals = unknown
> = {
    [Key in `on${string}`]: (self: Widget<Self>) => unknown
} & Partial<Signals> & BindableProps<Props & {
    className?: string
    css?: string
    cursor?: string
}> & {
    onDestroy?: (self: Widget<Self>) => unknown
    onDraw?: (self: Widget<Self>) => unknown
    setup?: (self: Widget<Self>) => void
}

type Cursor =
    | "default"
    | "help"
    | "pointer"
    | "context-menu"
    | "progress"
    | "wait"
    | "cell"
    | "crosshair"
    | "text"
    | "vertical-text"
    | "alias"
    | "copy"
    | "no-drop"
    | "move"
    | "not-allowed"
    | "grab"
    | "grabbing"
    | "all-scroll"
    | "col-resize"
    | "row-resize"
    | "n-resize"
    | "e-resize"
    | "s-resize"
    | "w-resize"
    | "ne-resize"
    | "nw-resize"
    | "sw-resize"
    | "se-resize"
    | "ew-resize"
    | "ns-resize"
    | "nesw-resize"
    | "nwse-resize"
    | "zoom-in"
    | "zoom-out"
