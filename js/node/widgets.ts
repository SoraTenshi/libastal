/* eslint-disable max-len */
import gi from "node-gtk"
import proxy, { type ConstructProps, type Widget } from "../src/astalify.js"
import type GtkT from "@girs/node-gtk-3.0/node-gtk-3.0"
import type AstalT from "@girs/node-astal-0.1/node-astal-0.1"

const Astal = gi.require("Astal", "0.1")
const Gtk = gi.require("Gtk", "3.0")

const proxify = proxy(Gtk,
    prop => `set${prop.charAt(0).toUpperCase() + prop.slice(1)}`,
    {
        cssGetter: Astal.widgetGetCss,
        cssSetter: Astal.widgetSetCss,
        classGetter: Astal.widgetGetClassNames,
        classSetter: Astal.widgetSetClassNames,
        cursorGetter: Astal.widgetGetCursor,
        cursorSetter: Astal.widgetSetCursor,
    })

export function astalify<
    C extends typeof Gtk.Widget,
    P extends Record<string, any>,
    N extends string = "Widget",
>(klass: C) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Astal<N> = Omit<C, "new"> & {
        new(props: P, ...children: GtkT.Widget[]): Widget<C>
        (props: P, ...children: GtkT.Widget[]): Widget<C>
    }

    return proxify(klass) as unknown as Astal<N>
}

// Label
export const Label = astalify<typeof Gtk.Label, LabelProps, "Label">(Gtk.Label)
export type LabelProps = ConstructProps<typeof Gtk.Label, GtkT.Label.ConstructorProperties>

// Icon
export const Icon = astalify<typeof Astal.Icon, IconProps, "Icon">(Astal.Icon)
export type IconProps = ConstructProps<typeof Astal.Icon, AstalT.Icon.ConstructorProperties>

// Button
export const Button = astalify<typeof Astal.Button, ButtonProps, "Button">(Astal.Button)
export type ButtonProps = ConstructProps<typeof Astal.Button, AstalT.Button.ConstructorProperties, {
    onClicked: (self: Widget<typeof Astal.Button>) => void
}>

// Window
export const Window = astalify<typeof Astal.Window, WindowProps, "Window">(Astal.Window)
export type WindowProps = ConstructProps<typeof Astal.Window, AstalT.Window.ConstructorProperties>

// Box
export const Box = astalify<typeof Astal.Box, BoxProps, "Box">(Astal.Box)
export type BoxProps = ConstructProps<typeof Astal.Box, AstalT.Box.ConstructorProperties>

// CenterBox
export const CenterBox = astalify<typeof Astal.CenterBox, CenterBoxProps, "CenterBox">(Astal.CenterBox)
export type CenterBoxProps = ConstructProps<typeof Astal.CenterBox, AstalT.CenterBox.ConstructorProperties>

// EventBox
export const EventBox = astalify<typeof Astal.EventBox, EventBoxProps, "EventBox">(Astal.EventBox)
export type EventBoxProps = ConstructProps<typeof Astal.EventBox, AstalT.EventBox.ConstructorProperties>
