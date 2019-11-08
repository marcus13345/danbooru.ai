import {LitElement, html} from 'lit-element';
import './photo-gallery-icon';

class Gallery extends LitElement {
	constructor(...args) {
		super(...args);
	}

	static get properties() {
		return {
			height: {
				type: Number,
				value: 240
			},
			selected: {
				type: Number,
				value: -1,
				notify: true
			}
		}
	}

	render() {
		return html`
			<style>
				:host { 
					display: block;
					overflow: hidden;
				}

				.grid {
					display: flex;
					flex-wrap: wrap;
					margin: -4px;
				}

				.grid ::slotted(.item) {
					flex-grow: 1;
					margin: 4px;
					background-position: center;
					background-repeat: no-repeat;
					background-size: cover;
					cursor: pointer;
				}

				.slideshow {
					position: fixed;
					top: 0;
					right: 0;
					bottom: 0;
					left: 0;
					z-index: 2400;
					display: none;
					background-color: black;
					user-select: none;
				}

				.slide {
					position: absolute;
					top: 0;
					right: 0;
					bottom: 0;
					left: 0;
					max-width: 100%;
					max-height: 100%;
					margin: auto;
				}

				.chevron {
					position: absolute;
					top: 50%;
					margin-top: -18px;
					transition: opacity 0.25s ease-in-out;
					opacity: 0.2;
					/* --photo-gallery-icon: {
						width: 36px;
						height: 36px;
					}; */
				}

				.chevron:hover {
					opacity: 1;
				}

				.chevron:first-of-type {
					left: 24px;
				}

				.chevron:last-of-type {
					right: 24px;
				}

				.toolbar {
					position: fixed;
					top: 0;
					right: 0;
					left: 0;
					z-index: 2400;
					height: 64px;
					background-image: linear-gradient(black, transparent);
					transform: translateY(-100%);
					transition: transform 0.25s ease-in-out 0.05s;
					visibility: hidden;
					will-change: transform;
				}

				.toolbar[visible] {
					transform: translateY(0);
					visibility: visible;
				}

				.back {
					padding: 20px 24px;
				}
			</style>

			<iron-a11y-keys target='[[$.slideshow]]' keys='esc' on-keys-pressed='close'></iron-a11y-keys>
			<iron-a11y-keys target='[[$.slideshow]]' keys='left up' on-keys-pressed='previous'></iron-a11y-keys>
			<iron-a11y-keys target='[[$.slideshow]]' keys='right down' on-keys-pressed='next'></iron-a11y-keys>
			
			<div class='grid' @slotchange=${this.updateItems}>
				<slot id='grid'></slot>
			</div>

			<div class='slideshow' tabindex='-1' id='slideshow'>
				<img class='slide' id='slide'>
				<img class='slide' style='display: none' id='exitSlide'>
				<photo-gallery-icon class='chevron' icon='chevron-left' @click=${this.previous}></photo-gallery-icon>
				<photo-gallery-icon class='chevron' icon='chevron-right' @click=${this.next}></photo-gallery-icon>
			</div>

			<div class='toolbar' visible$='[[isFullScreen]]'>
				<slot name='toolbar'>
					<photo-gallery-icon class='back' icon='arrow-back' @click=${this.close}></photo-gallery-icon>
				</slot>
			</div>
		`;
	}

	superCoolMethod() {
		console.log(this);
	}

	anime (properties) {
		let timing = { duration: 250, easing: 'easeInOutQuad' }
		window.anime(Object.assign(timing, properties))
	}

	closest (element, className) {
		while (element) {
			if (element.classList.contains(className)) return element
			element = element.parentElement
		}
	}

	getAspectRatio (item) {
		let url = item.dataset.url;
		let match = url.match(/aspect-ratio=([.\d]+)/);
		if(match !== null)
			return parseFloat(match[1])
		let attribute = item.getAttribute('aspect-ratio');
		if(attribute !== null)
			return parseFloat(attribute);
		return 1;
	}

	updateItemsStyle () {
		this.items.forEach(item => {
			let aspectRatio = this.getAspectRatio(item)
			item.style.width = this.height * aspectRatio + 'px'
			item.style.height = this.height + 'px'
			item.style.backgroundImage = `url('${item.dataset.url}')`
		})
	}

	updateItems () {
		this.items = this.$.grid.assignedNodes()
			.filter(node => node.nodeType === Node.ELEMENT_NODE)
			.filter(node => node.classList.contains('item'))
		this.updateItemsStyle()
	}

	toggleScrollBar (enabled) {
		let html = document.documentElement
		let body = document.body
		if (!enabled) {
			let top = -html.scrollTop + 'px'
			body.style.position = 'fixed'
			body.style.top = top
		} else {
			let top = -parseInt(body.style.top, 10)
			body.style.position = ''
			body.style.top = ''
			html.scrollTop = top
		}
	}

	open (event) {
		let item = this.closest(event.target, 'item')
		if (!item) return

		let slide = this.$.slide
		let slideshow = this.$.slideshow
		let rect = item.getBoundingClientRect()
		slide.src = item.dataset.url
		slideshow.style.display = 'block'
		slideshow.focus()
		this.anime({
			targets: slideshow,
			top: [rect.top, 0],
			left: [rect.left, 0],
			bottom: [window.innerHeight - rect.top - rect.height, 0],
			right: [window.innerWidth - rect.left - rect.width, 0]
		})
		this.selected = this.items.indexOf(item)
		this.isFullScreen = true
		this.toggleScrollBar(false)
	}

	close () {
		let slide = this.$.slide
		let slideshow = this.$.slideshow
		this.anime({
			targets: slideshow,
			opacity: [1, 0],
			complete () {
				slide.src = ''
				slideshow.removeAttribute('style')
			}
		})
		this.selected = -1
		this.isFullScreen = false
		this.toggleScrollBar(true)
	}

	change (direction) {
		let nextItem = this.items[this.selected + direction]
		if (!nextItem) return

		let slide = this.$.slide
		let exitSlide = this.$.exitSlide
		exitSlide.src = slide.src
		slide.src = nextItem.dataset.url
		this.anime({
			targets: slide,
			opacity: [0, 1]
		})
		exitSlide.style.display = 'block'
		this.anime({
			targets: exitSlide,
			opacity: [1, 0],
			translateX: ['0', `${-direction}0%`],
			complete () {
				exitSlide.style.display = 'none'
			}
		})
		this.selected += direction
	}

	previous () {
		this.change(-1)
	}

	next () {
		this.change(1)
	}

	//fuirst update is like a ready, happens after first render.
	firstUpdated () {
		
		// setup polymer like $ references
		this.$ = {};
		this.$.grid = this.shadowRoot.querySelector('#grid')
		this.$.slide = this.shadowRoot.querySelector('#slide')
		this.$.exitSlide = this.shadowRoot.querySelector('#exitSlide')
		this.$.slideshow = this.shadowRoot.querySelector('#slideshow')
		
		this.updateItems()
	}
}

window.customElements.define('lit-gallery', Gallery);