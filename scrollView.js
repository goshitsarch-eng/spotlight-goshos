// gosh is launcher - scrollview helpers that work on gnome 45 through 50
// SPDX-License-Identifier: GPL-3.0-or-later

// gnome 45 scrollview is an st.bin with get_vscroll_bar and set_policy
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-45/src/st/st-scroll-view.h
// gnome 48 rewrote it as an st.widget with set_child and get_vadjustment
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-48/src/st/st-scroll-view.h
// one zip has to speak both so every call is a feature detect not a version branch

export function attachScrollChild(scrollView, child) {
    // set_child is the single-child api on 45 (via st.bin) and on 48+
    // add_child does not wire the scrollable content on some 45/46 builds
    if (typeof scrollView.set_child === 'function')
        scrollView.set_child(child);
    else
        scrollView.add_child(child);
}

export function applyScrollPolicy(scrollView, hPolicy, vPolicy) {
    // set_policy exists on 45 through 50 - constructor policy props are the fallback
    if (typeof scrollView.set_policy === 'function')
        scrollView.set_policy(hPolicy, vPolicy);
    else {
        scrollView.hscrollbar_policy = hPolicy;
        scrollView.vscrollbar_policy = vPolicy;
    }
}

export function getVerticalAdjustment(scrollView) {
    // 48 removed get_vscroll_bar and exposes the adjustment directly
    // both paths can be null before the first allocate
    if (typeof scrollView.get_vadjustment === 'function')
        return scrollView.get_vadjustment();
    if (typeof scrollView.get_vscroll_bar !== 'function')
        return null;
    const bar = scrollView.get_vscroll_bar();
    if (!bar)
        return null;
    return bar.get_adjustment();
}
