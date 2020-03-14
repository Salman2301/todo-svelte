
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    let running = false;
    function run_tasks() {
        tasks.forEach(task => {
            if (!task[0](now())) {
                tasks.delete(task);
                task[1]();
            }
        });
        running = tasks.size > 0;
        if (running)
            raf(run_tasks);
    }
    function loop(fn) {
        let task;
        if (!running) {
            running = true;
            raf(run_tasks);
        }
        return {
            promise: new Promise(fulfil => {
                tasks.add(task = [fn, fulfil]);
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Clock.svelte generated by Svelte v3.12.1 */

    const file = "src\\Clock.svelte";

    function create_fragment(ctx) {
    	var h1, t0, span, t1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("TIME:\r\n  ");
    			span = element("span");
    			t1 = text(ctx.timeStr);
    			attr_dev(span, "class", "svelte-gq3uuu");
    			add_location(span, file, 29, 2, 428);
    			attr_dev(h1, "class", "svelte-gq3uuu");
    			add_location(h1, file, 27, 0, 411);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, span);
    			append_dev(span, t1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.timeStr) {
    				set_data_dev(t1, ctx.timeStr);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let timeStr = "";
      setInterval(() => {
        $$invalidate('timeStr', timeStr = new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata"
        }));
      }, 1000);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('timeStr' in $$props) $$invalidate('timeStr', timeStr = $$props.timeStr);
    	};

    	return { timeStr };
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Clock", options, id: create_fragment.name });
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400 }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src\Quote.svelte generated by Svelte v3.12.1 */

    const file$1 = "src\\Quote.svelte";

    // (34:0) {#if quote != undefined}
    function create_if_block(ctx) {
    	var p, t0_value = ctx.quote.content + "", t0, t1, span, t2, t3_value = ctx.quote.author + "", t3, p_transition, current, dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			t2 = text("- ");
    			t3 = text(t3_value);
    			attr_dev(span, "class", "svelte-1mm77xp");
    			add_location(span, file$1, 36, 4, 722);
    			attr_dev(p, "class", "svelte-1mm77xp");
    			add_location(p, file$1, 34, 2, 635);
    			dispose = listen_dev(p, "click", ctx.getQuote);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.quote) && t0_value !== (t0_value = ctx.quote.content + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((!current || changed.quote) && t3_value !== (t3_value = ctx.quote.author + "")) {
    				set_data_dev(t3, t3_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			add_render_callback(() => {
    				if (!p_transition) p_transition = create_bidirectional_transition(p, fade, { duration: 2000 }, true);
    				p_transition.run(1);
    			});

    			current = true;
    		},

    		o: function outro(local) {
    			if (!p_transition) p_transition = create_bidirectional_transition(p, fade, { duration: 2000 }, false);
    			p_transition.run(0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    				if (p_transition) p_transition.end();
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(34:0) {#if quote != undefined}", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.quote != undefined) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.quote != undefined) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let quote;
      function getQuote() {
        let url = "https://api.quotable.io/random";
        fetch(url)
          .then(res => res.json())
          .then(data => {
            $$invalidate('quote', quote = data);
          });
      }
      getQuote();

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('quote' in $$props) $$invalidate('quote', quote = $$props.quote);
    	};

    	return { quote, getQuote };
    }

    class Quote extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Quote", options, id: create_fragment$1.name });
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    /*!
     * Font Awesome Free 5.11.2 by @fontawesome - https://fontawesome.com
     * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
     */

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let todos = writable(parseLocal("todos") || [{title : "some title"}]);
    let currTodo = writable("123");
    let darkmode = writable(BoolLocal("darkmode"));
    let showSetting = writable(false);

    function parseLocal (key) {return JSON.parse(localStorage.getItem(key))}
    function BoolLocal (key) { return localStorage.getItem(key) === "true"}

    /* src\Timer.svelte generated by Svelte v3.12.1 */

    const file$2 = "src\\Timer.svelte";

    function create_fragment$2(ctx) {
    	var p, t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.time);
    			attr_dev(p, "id", ctx.id);
    			attr_dev(p, "class", "svelte-vt2v8v");
    			add_location(p, file$2, 33, 0, 721);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.time) {
    				set_data_dev(t, ctx.time);
    			}

    			if (changed.id) {
    				attr_dev(p, "id", ctx.id);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { start = new Date(), end = new Date(), id = "" } = $$props;
      end.setMinutes(end.getMinutes() + 500);
      let time = "";

      let intervalID = setInterval(() => {
        $$invalidate('start', start = new Date());
        $$invalidate('time', time = end - start);
        // time = new Date(time);
        let sec = Math.round((time / 1000) % 60) % 60;
        let min = Math.round(time / (60 * 1000)) % 60;
        let hour = Math.round(time / (60 * 60 * 1000));

        $$invalidate('time', time = `${hour}:${min}:${sec}`);

        let isVisible = document.getElementById(id) !== null;
        if (!isVisible) endTimer();
      }, 1000);

      function endTimer() {
        clearInterval(intervalID);
      }

    	const writable_props = ['start', 'end', 'id'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('start' in $$props) $$invalidate('start', start = $$props.start);
    		if ('end' in $$props) $$invalidate('end', end = $$props.end);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    	};

    	$$self.$capture_state = () => {
    		return { start, end, id, time, intervalID };
    	};

    	$$self.$inject_state = $$props => {
    		if ('start' in $$props) $$invalidate('start', start = $$props.start);
    		if ('end' in $$props) $$invalidate('end', end = $$props.end);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('time' in $$props) $$invalidate('time', time = $$props.time);
    		if ('intervalID' in $$props) intervalID = $$props.intervalID;
    	};

    	return { start, end, id, time };
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["start", "end", "id"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Timer", options, id: create_fragment$2.name });
    	}

    	get start() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\TodoItem.svelte generated by Svelte v3.12.1 */

    const file$3 = "src\\TodoItem.svelte";

    // (104:6) {#if currTodoVal === id}
    function create_if_block_1(ctx) {
    	var current;

    	var timer = new Timer({
    		props: { id: ctx.id },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			timer.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(timer, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var timer_changes = {};
    			if (changed.id) timer_changes.id = ctx.id;
    			timer.$set(timer_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(timer.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(timer.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(timer, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(104:6) {#if currTodoVal === id}", ctx });
    	return block;
    }

    // (111:5) {#if isFocus}
    function create_if_block$1(ctx) {
    	var div, i, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-check");
    			add_location(i, file$3, 112, 8, 2378);
    			attr_dev(div, "class", "btn-update svelte-8mwz55");
    			add_location(div, file$3, 111, 6, 2311);
    			dispose = listen_dev(div, "click", ctx.handleUpdateTodoClick);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(111:5) {#if isFocus}", ctx });
    	return block;
    }

    function create_fragment$3(ctx) {
    	var div4, div3, div0, t0, div1, input, input_id_value, t1, t2, div2, i, div4_intro, current, dispose;

    	var if_block0 = (ctx.currTodoVal === ctx.id) && create_if_block_1(ctx);

    	var if_block1 = (ctx.isFocus) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			input = element("input");
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			div2 = element("div");
    			i = element("i");
    			attr_dev(div0, "class", "timer svelte-8mwz55");
    			add_location(div0, file$3, 102, 4, 2059);
    			input.disabled = true;
    			input.value = ctx.title;
    			attr_dev(input, "id", input_id_value = "input-" + ctx.id);
    			attr_dev(input, "class", "svelte-8mwz55");
    			add_location(input, file$3, 108, 6, 2192);
    			attr_dev(div1, "class", "title svelte-8mwz55");
    			add_location(div1, file$3, 107, 4, 2165);
    			attr_dev(i, "class", "fa fa-trash");
    			add_location(i, file$3, 116, 6, 2490);
    			attr_dev(div2, "class", "del svelte-8mwz55");
    			add_location(div2, file$3, 115, 4, 2435);
    			attr_dev(div3, "class", "row svelte-8mwz55");
    			add_location(div3, file$3, 101, 2, 2036);
    			attr_dev(div4, "class", "todo-item svelte-8mwz55");
    			add_location(div4, file$3, 100, 0, 1949);

    			dispose = [
    				listen_dev(input, "keypress", ctx.handleKeyPress),
    				listen_dev(div2, "click", ctx.handleDelTodoClick),
    				listen_dev(div4, "click", ctx.updateCurrTodo),
    				listen_dev(div4, "dblclick", ctx.onDblClick)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, input);
    			append_dev(div3, t1);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, i);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.currTodoVal === ctx.id) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (!current || changed.title) {
    				prop_dev(input, "value", ctx.title);
    			}

    			if ((!current || changed.id) && input_id_value !== (input_id_value = "input-" + ctx.id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (ctx.isFocus) {
    				if (!if_block1) {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div3, t2);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);

    			if (!div4_intro) {
    				add_render_callback(() => {
    					div4_intro = create_in_transition(div4, slide, {});
    					div4_intro.start();
    				});
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div4);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	
      let { id, title, handleDelTodo, handleUpdateTodo } = $$props;
      let isFocus = false;

      let currTodoVal;
      const handleDelTodoClick = e => {
        handleDelTodo(id);
      };

      const updateCurrTodo = e => {
        currTodo.update(oldId => id);
      };

      const unsubscribe = currTodo.subscribe(todoID => {
        $$invalidate('currTodoVal', currTodoVal = todoID);
      });

      const onDblClick = e => {
        e.target.disabled = false;
        $$invalidate('isFocus', isFocus = true);
        e.target.focus();
      };

      const handleUpdateTodoClick = e => {
        let inputField = document.getElementById("input-" + id);
        inputField.disabled = true;
        $$invalidate('isFocus', isFocus = false);
        handleUpdateTodo(id, inputField.value);
      };
      const handleKeyPress = e => {
        let {key} = e;
        if(key === "Enter") {
           handleUpdateTodoClick();
        }
      };

    	const writable_props = ['id', 'title', 'handleDelTodo', 'handleUpdateTodo'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TodoItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('handleDelTodo' in $$props) $$invalidate('handleDelTodo', handleDelTodo = $$props.handleDelTodo);
    		if ('handleUpdateTodo' in $$props) $$invalidate('handleUpdateTodo', handleUpdateTodo = $$props.handleUpdateTodo);
    	};

    	$$self.$capture_state = () => {
    		return { id, title, handleDelTodo, handleUpdateTodo, isFocus, currTodoVal };
    	};

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('handleDelTodo' in $$props) $$invalidate('handleDelTodo', handleDelTodo = $$props.handleDelTodo);
    		if ('handleUpdateTodo' in $$props) $$invalidate('handleUpdateTodo', handleUpdateTodo = $$props.handleUpdateTodo);
    		if ('isFocus' in $$props) $$invalidate('isFocus', isFocus = $$props.isFocus);
    		if ('currTodoVal' in $$props) $$invalidate('currTodoVal', currTodoVal = $$props.currTodoVal);
    	};

    	return {
    		id,
    		title,
    		handleDelTodo,
    		handleUpdateTodo,
    		isFocus,
    		currTodoVal,
    		handleDelTodoClick,
    		updateCurrTodo,
    		onDblClick,
    		handleUpdateTodoClick,
    		handleKeyPress
    	};
    }

    class TodoItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["id", "title", "handleDelTodo", "handleUpdateTodo"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TodoItem", options, id: create_fragment$3.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<TodoItem> was created without expected prop 'id'");
    		}
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<TodoItem> was created without expected prop 'title'");
    		}
    		if (ctx.handleDelTodo === undefined && !('handleDelTodo' in props)) {
    			console.warn("<TodoItem> was created without expected prop 'handleDelTodo'");
    		}
    		if (ctx.handleUpdateTodo === undefined && !('handleUpdateTodo' in props)) {
    			console.warn("<TodoItem> was created without expected prop 'handleUpdateTodo'");
    		}
    	}

    	get id() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleDelTodo() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleDelTodo(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleUpdateTodo() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleUpdateTodo(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\TodoAdd.svelte generated by Svelte v3.12.1 */

    const file$4 = "src\\TodoAdd.svelte";

    function create_fragment$4(ctx) {
    	var form, input0, t0, input1, t1, input2, t2, input3, dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			input2 = element("input");
    			t2 = space();
    			input3 = element("input");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter a new todo");
    			attr_dev(input0, "class", "input newTodo svelte-1r7o4ec");
    			add_location(input0, file$4, 58, 2, 955);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "HR");
    			attr_dev(input1, "class", "input hr svelte-1r7o4ec");
    			add_location(input1, file$4, 65, 2, 1081);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "placeholder", "Min");
    			attr_dev(input2, "class", "input min svelte-1r7o4ec");
    			add_location(input2, file$4, 71, 2, 1182);
    			attr_dev(input3, "type", "submit");
    			attr_dev(input3, "class", "submit");
    			add_location(input3, file$4, 78, 2, 1288);
    			attr_dev(form, "class", "svelte-1r7o4ec");
    			add_location(form, file$4, 57, 0, 924);

    			dispose = [
    				listen_dev(input0, "input", ctx.input0_input_handler),
    				listen_dev(input1, "input", ctx.input1_input_handler),
    				listen_dev(input2, "input", ctx.input2_input_handler),
    				listen_dev(form, "submit", ctx.onSubmit)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, input0);

    			set_input_value(input0, ctx.newTodoIn);

    			append_dev(form, t0);
    			append_dev(form, input1);

    			set_input_value(input1, ctx.newHr);

    			append_dev(form, t1);
    			append_dev(form, input2);

    			set_input_value(input2, ctx.newMin);

    			append_dev(form, t2);
    			append_dev(form, input3);
    		},

    		p: function update(changed, ctx) {
    			if (changed.newTodoIn && (input0.value !== ctx.newTodoIn)) set_input_value(input0, ctx.newTodoIn);
    			if (changed.newHr && (input1.value !== ctx.newHr)) set_input_value(input1, ctx.newHr);
    			if (changed.newMin && (input2.value !== ctx.newMin)) set_input_value(input2, ctx.newMin);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(form);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let newTodoIn = "";
      let newHr = "";
      let newMin = "";

      const onSubmit = e => {
        e.preventDefault();
        if (!newTodoIn) return;
        if(!newHr || !newMin) return;

        let numHr = ("0" + Number(newHr)).slice(-2);
        let numMin = ("0" + Number(newMin)).slice(-2);

        let time = `${numHr}:${numMin}`;

        todos.update(todosVal => [
          {
            id: getID(),
            title: newTodoIn,
            time: time
          },
          ...todosVal
        ]);

        $$invalidate('newTodoIn', newTodoIn = "");
        $$invalidate('newHr', newHr = "");
        $$invalidate('newMin', newMin = "");
      };

      let getID = () =>
        Math.random()
          .toString(36)
          .substring(7);

    	function input0_input_handler() {
    		newTodoIn = this.value;
    		$$invalidate('newTodoIn', newTodoIn);
    	}

    	function input1_input_handler() {
    		newHr = this.value;
    		$$invalidate('newHr', newHr);
    	}

    	function input2_input_handler() {
    		newMin = this.value;
    		$$invalidate('newMin', newMin);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('newTodoIn' in $$props) $$invalidate('newTodoIn', newTodoIn = $$props.newTodoIn);
    		if ('newHr' in $$props) $$invalidate('newHr', newHr = $$props.newHr);
    		if ('newMin' in $$props) $$invalidate('newMin', newMin = $$props.newMin);
    		if ('getID' in $$props) getID = $$props.getID;
    	};

    	return {
    		newTodoIn,
    		newHr,
    		newMin,
    		onSubmit,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	};
    }

    class TodoAdd extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TodoAdd", options, id: create_fragment$4.name });
    	}
    }

    /* src\Todos.svelte generated by Svelte v3.12.1 */

    const file$5 = "src\\Todos.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.todo = list[i];
    	return child_ctx;
    }

    // (56:2) {:else}
    function create_else_block(ctx) {
    	var div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Awesome no todo left! great work:)";
    			set_style(div, "text-align", "center");
    			add_location(div, file$5, 56, 4, 1312);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(56:2) {:else}", ctx });
    	return block;
    }

    // (47:2) {#if todosVal.length}
    function create_if_block$2(ctx) {
    	var div0, t0, t1_value = ctx.todosVal.length + "", t1, t2, div1, current;

    	let each_value = ctx.todosVal;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("Todo left : ");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(div0, "class", "title svelte-14q09wr");
    			add_location(div0, file$5, 47, 4, 1035);
    			attr_dev(div1, "class", "todo-list svelte-14q09wr");
    			add_location(div1, file$5, 48, 4, 1095);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.todosVal) && t1_value !== (t1_value = ctx.todosVal.length + "")) {
    				set_data_dev(t1, t1_value);
    			}

    			if (changed.todosVal || changed.handleDelTodo || changed.handleUpdateTodo) {
    				each_value = ctx.todosVal;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div0);
    				detach_dev(t2);
    				detach_dev(div1);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$2.name, type: "if", source: "(47:2) {#if todosVal.length}", ctx });
    	return block;
    }

    // (50:6) {#each todosVal as todo}
    function create_each_block(ctx) {
    	var div, t, current;

    	var todoitem_spread_levels = [
    		ctx.todo,
    		{ handleDelTodo: ctx.handleDelTodo },
    		{ handleUpdateTodo: ctx.handleUpdateTodo }
    	];

    	let todoitem_props = {};
    	for (var i = 0; i < todoitem_spread_levels.length; i += 1) {
    		todoitem_props = assign(todoitem_props, todoitem_spread_levels[i]);
    	}
    	var todoitem = new TodoItem({ props: todoitem_props, $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			todoitem.$$.fragment.c();
    			t = space();
    			attr_dev(div, "class", "todo-item svelte-14q09wr");
    			add_location(div, file$5, 50, 8, 1160);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(todoitem, div, null);
    			append_dev(div, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var todoitem_changes = (changed.todosVal || changed.handleDelTodo || changed.handleUpdateTodo) ? get_spread_update(todoitem_spread_levels, [
    									(changed.todosVal) && get_spread_object(ctx.todo),
    			(changed.handleDelTodo) && { handleDelTodo: ctx.handleDelTodo },
    			(changed.handleUpdateTodo) && { handleUpdateTodo: ctx.handleUpdateTodo }
    								]) : {};
    			todoitem.$set(todoitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(todoitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(todoitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(todoitem);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(50:6) {#each todosVal as todo}", ctx });
    	return block;
    }

    function create_fragment$5(ctx) {
    	var t, div, current_block_type_index, if_block, current;

    	var todoadd = new TodoAdd({ $$inline: true });

    	var if_block_creators = [
    		create_if_block$2,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.todosVal.length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			todoadd.$$.fragment.c();
    			t = space();
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "todos");
    			add_location(div, file$5, 45, 0, 985);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(todoadd, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(todoadd.$$.fragment, local);

    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(todoadd.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(todoadd, detaching);

    			if (detaching) {
    				detach_dev(t);
    				detach_dev(div);
    			}

    			if_blocks[current_block_type_index].d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	

      let todosVal = [];

      const unsubscribe = todos.subscribe(todos => {
        $$invalidate('todosVal', todosVal = todos);
        localStorage.setItem("todos" ,JSON.stringify(todos));
      });
      let handleDelTodo = id => {
        todos.update(todosVal => [...todosVal.filter(el => el.id !== id)]);
      };
      let handleUpdateTodo = (id, newTitle) => {
        for(let i=0;i<todosVal.length; i++) {
          let todo = todosVal[i];
          if(todo.id === id) {
            $$invalidate('todosVal', todosVal[i].title = newTitle, todosVal);
            todos.update(todosVal => [...todosVal]);
            return;
          }
        }
      };

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('todosVal' in $$props) $$invalidate('todosVal', todosVal = $$props.todosVal);
    		if ('handleDelTodo' in $$props) $$invalidate('handleDelTodo', handleDelTodo = $$props.handleDelTodo);
    		if ('handleUpdateTodo' in $$props) $$invalidate('handleUpdateTodo', handleUpdateTodo = $$props.handleUpdateTodo);
    	};

    	return {
    		todosVal,
    		handleDelTodo,
    		handleUpdateTodo
    	};
    }

    class Todos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Todos", options, id: create_fragment$5.name });
    	}
    }

    /* src\Setting.svelte generated by Svelte v3.12.1 */

    const file$6 = "src\\Setting.svelte";

    // (26:4) {#if show}
    function create_if_block$3(ctx) {
    	var div3, div0, i, t0, div1, p0, t2, label, input, t3, span, t4, div2, p1, dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Dark mode";
    			t2 = space();
    			label = element("label");
    			input = element("input");
    			t3 = space();
    			span = element("span");
    			t4 = space();
    			div2 = element("div");
    			p1 = element("p");
    			p1.textContent = "Setting item here";
    			attr_dev(i, "class", "far fa-times-circle right svelte-41tf4j");
    			add_location(i, file$6, 28, 8, 811);
    			attr_dev(div0, "class", "item close-icon svelte-41tf4j");
    			add_location(div0, file$6, 27, 6, 711);
    			attr_dev(p0, "class", "svelte-41tf4j");
    			add_location(p0, file$6, 31, 10, 904);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "checkboxID");
    			attr_dev(input, "class", "svelte-41tf4j");
    			add_location(input, file$6, 33, 14, 970);
    			attr_dev(span, "class", "slider round svelte-41tf4j");
    			add_location(span, file$6, 34, 14, 1079);
    			attr_dev(label, "class", "switch svelte-41tf4j");
    			add_location(label, file$6, 32, 10, 932);
    			attr_dev(div1, "class", "item svelte-41tf4j");
    			add_location(div1, file$6, 30, 6, 874);
    			attr_dev(p1, "class", "svelte-41tf4j");
    			add_location(p1, file$6, 38, 10, 1185);
    			attr_dev(div2, "class", "item svelte-41tf4j");
    			add_location(div2, file$6, 37, 6, 1155);
    			attr_dev(div3, "class", "list svelte-41tf4j");
    			add_location(div3, file$6, 26, 6, 685);

    			dispose = [
    				listen_dev(div0, "click", ctx.click_handler),
    				listen_dev(input, "change", ctx.input_change_handler),
    				listen_dev(input, "change", ctx.handleDarkmode)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, i);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t2);
    			append_dev(div1, label);
    			append_dev(label, input);

    			input.checked = ctx.darkmodeVal;

    			append_dev(label, t3);
    			append_dev(label, span);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, p1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.darkmodeVal) input.checked = ctx.darkmodeVal;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div3);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$3.name, type: "if", source: "(26:4) {#if show}", ctx });
    	return block;
    }

    function create_fragment$6(ctx) {
    	var div1, t, div0, i, dispose;

    	var if_block = (ctx.show) && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			i = element("i");
    			attr_dev(i, "class", "fas fa-sliders-h fa-2x right svelte-41tf4j");
    			add_location(i, file$6, 43, 4, 1354);
    			attr_dev(div0, "class", "setting-icon");
    			add_location(div0, file$6, 42, 4, 1254);
    			attr_dev(div1, "class", "setting-panel svelte-41tf4j");
    			add_location(div1, file$6, 24, 0, 634);
    			dispose = listen_dev(div0, "click", ctx.click_handler_1);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.show) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			if (if_block) if_block.d();
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	
        let show = true;
        let darkmodeVal;

        const unsubscribe = showSetting.subscribe(showSettingRes => {
          $$invalidate('show', show = showSettingRes);
        });

        const unsubdarkmode = darkmode.subscribe(oldDarkmode => {
          $$invalidate('darkmodeVal', darkmodeVal = oldDarkmode);
        });


        const handleDarkmode = e => {
          let isChecked = e.target.checked;
          darkmode.update(oldDarkmode => isChecked);
        };

    	const click_handler = () => {showSetting.update(showSetting => false);};

    	function input_change_handler() {
    		darkmodeVal = this.checked;
    		$$invalidate('darkmodeVal', darkmodeVal);
    	}

    	const click_handler_1 = () => {showSetting.update(showSetting => !showSetting);};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('show' in $$props) $$invalidate('show', show = $$props.show);
    		if ('darkmodeVal' in $$props) $$invalidate('darkmodeVal', darkmodeVal = $$props.darkmodeVal);
    	};

    	return {
    		show,
    		darkmodeVal,
    		handleDarkmode,
    		click_handler,
    		input_change_handler,
    		click_handler_1
    	};
    }

    class Setting extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Setting", options, id: create_fragment$6.name });
    	}
    }

    /* src\App.svelte generated by Svelte v3.12.1 */
    const { document: document_1 } = globals;

    const file$7 = "src\\App.svelte";

    function create_fragment$7(ctx) {
    	var t0, div2, t1, div1, div0, t2, t3, current;

    	var quote = new Quote({ $$inline: true });

    	var clock = new Clock({ $$inline: true });

    	var todos = new Todos({ $$inline: true });

    	var setting = new Setting({ $$inline: true });

    	const block = {
    		c: function create() {
    			t0 = space();
    			div2 = element("div");
    			quote.$$.fragment.c();
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			clock.$$.fragment.c();
    			t2 = space();
    			todos.$$.fragment.c();
    			t3 = space();
    			setting.$$.fragment.c();
    			document_1.title = "Time tracker app";
    			attr_dev(div0, "class", "app svelte-16nkkyl");
    			add_location(div0, file$7, 54, 4, 1119);
    			attr_dev(div1, "class", "container svelte-16nkkyl");
    			add_location(div1, file$7, 53, 2, 1090);
    			attr_dev(div2, "class", "body");
    			add_location(div2, file$7, 51, 0, 1055);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(quote, div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(clock, div0, null);
    			append_dev(div0, t2);
    			mount_component(todos, div0, null);
    			append_dev(div2, t3);
    			mount_component(setting, div2, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(quote.$$.fragment, local);

    			transition_in(clock.$$.fragment, local);

    			transition_in(todos.$$.fragment, local);

    			transition_in(setting.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(quote.$$.fragment, local);
    			transition_out(clock.$$.fragment, local);
    			transition_out(todos.$$.fragment, local);
    			transition_out(setting.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t0);
    				detach_dev(div2);
    			}

    			destroy_component(quote);

    			destroy_component(clock);

    			destroy_component(todos);

    			destroy_component(setting);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$7($$self) {
    	


     const unsubscribe = darkmode.subscribe(isDarkmode => {
        const body = document.getElementsByTagName("body")[0];
        const colDarkGrey = "#1f1f1f";
        const colWhiteGrey = "#f5f5f5";

         localStorage.setItem("darkmode" , isDarkmode);
        if(isDarkmode) {
          body.style.backgroundColor = colDarkGrey;
          body.style.color = colWhiteGrey;
        } else {
          body.style.backgroundColor = colWhiteGrey;
          body.style.color = colDarkGrey;
        }
      });

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {};

    	return {};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$7.name });
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map