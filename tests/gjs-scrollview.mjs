import {attachScrollChild, applyScrollPolicy, getVerticalAdjustment} from '../scrollView.js';

const modern = {
    set_child(c) {
        this.child = c;
    },
    set_policy(h, v) {
        this.v = v;
    },
    get_vadjustment() {
        return {ok: 1};
    },
};
attachScrollChild(modern, 'box');
applyScrollPolicy(modern, 0, 1);
if (modern.child !== 'box' || modern.v !== 1 || getVerticalAdjustment(modern).ok !== 1)
    throw new Error('modern path failed');

const legacy = {
    add_child(c) {
        this.child = c;
    },
    get_vscroll_bar() {
        return {
            get_adjustment() {
                return {ok: 2};
            },
        };
    },
};
attachScrollChild(legacy, 'box');
applyScrollPolicy(legacy, 2, 3);
if (legacy.child !== 'box' || legacy.vscrollbar_policy !== 3 || getVerticalAdjustment(legacy).ok !== 2)
    throw new Error('legacy path failed');

const unrealized = {
    get_vscroll_bar() {
        return null;
    },
};
if (getVerticalAdjustment(unrealized) !== null)
    throw new Error('null scrollbar must not throw');

const emptyModern = {
    get_vadjustment() {
        return null;
    },
};
if (getVerticalAdjustment(emptyModern) !== null)
    throw new Error('null vadjustment must not throw');

print('gjs scrollView helpers ok');

