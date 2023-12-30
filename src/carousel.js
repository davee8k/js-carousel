/**
 * jQuery Carousel | options - sameSize	boolean; all images have same size - load only one image to find content size
 * min jquery version 1.9+
 *
 * @author DaVee8k
 * @version 0.39.1
 * @license WTFNMFPL 1.0
 */
(function ($) {
	$.fn.carousel = function (option) {
		var self = this;
		this.item = option['item'] !== undefined ? option['item'] : 'a';
		this.arrowsClass = option['arrowsClass'] !== undefined ? option['arrowsClass'] : 'carousel-arrows';
		this.move = option['move'] !== undefined ? option['move'] : 1;
		this.pause = option['pause'] !== undefined ? option['pause'] : null;
		this.speed = option['speed'] !== undefined ? option['speed'] : 2;
		this.endless = option['endless'] !== undefined ? option['endless'] : false;
		this.cssOnly = option['cssOnly'] !== undefined ? option['cssOnly'] : false;
		this.sameSize = option['sameSize'] !== undefined ? option['sameSize'] : false;
		this.rows = option['rows'] !== undefined ? option['rows'] : 1;
		this.vertical = option['direction'] === 'vertical';
		this.way = this.vertical ? "top" : "left";
		this.wayFill = this.vertical ? "bottom" : "right";

		this.elmArrow = null;
		this.elmPager = null;
		this.size = 0;
		this.viewSize = 0;
		this.count = 0;
		this.borderTolerance = 20;
		this.imgFix = 0; // remove main image from position counter
		this.timer = null;
		this.isSwiping = false;
		this.position = null;

		/**
		 * Set corrent content width
		 * @param {Boolean} sameSize
		 * @returns {Boolean}
		 */
		this.init = function (sameSize) {
			this.viewSize = this.vertical ? $(this).height() : $(this).width();
			this.count = Math.ceil($(this).find(this.item).not(".carousel-endless-box " + this.item).length / this.rows);

			var imgs = $(this).find(this.item).find("img").not(".carousel-endless-box " + this.item + " img");
			if ($(imgs).length > 0) {
				this.loadImages(sameSize ? $(imgs).first() : $(imgs).slice(0, this.count));
			}
			else {
				this.continueInit(sameSize);
			}
			return this.count > 1;
		};

		/**
		 *
		 * @param {Array} imgs
		 * @param {Boolean} sameSize
		 */
		this.loadImages = function (imgs, sameSize) {
			var loaded = 0;
			var total = $(imgs).length;
			$(imgs).each( function () {
				var item = this;
				var img = new Image();
				$(img).one("load error", function () {
					if (++loaded >= total) self.continueInit(sameSize);
				}).attr('src', $(item).data("src") || $(item).attr("src"));
			});
		};

		/**
		 *
		 * @param {Boolean} sameSize
		 */
		this.continueInit = function (sameSize) {
			this.size = 0;
			if (sameSize) {
				this.size = this.getItemSize($(this).find(this.item).first()) * this.count;
			}
			else {
				var items = $(this).find(this.item).slice(0, this.count).get();
				if (items) {
					for (var i in items) {
						this.size += this.getItemSize(items[i]);
					}
				}
			}
			this.finishInit();
		};

		/**
		 * Activate arrows and duplicate content for endless mode
		 */
		this.finishInit = function () {
			if (this.endless) {
				var inner = $(this).children();
				var multiply = Math.max(1, Math.ceil(Math.floor(this.viewSize) / Math.ceil(this.size)));

				if ($(inner).children(".carousel-endless-box").length === 0 && multiply !== Infinity) {
					var filler = $(inner).html();
					$(inner).append('<div class="carousel-endless-box carousel-endless-pre">');
					$(inner).append('<div class="carousel-endless-box carousel-endless-post">');

					for (var i = 0; i < multiply; i++) {
						$(inner).children(".carousel-endless-pre").append(filler);
						$(inner).children(".carousel-endless-post").append(filler);
					}
				}
				$(inner).children(".carousel-endless-pre").css(this.way, -(multiply * this.size) + "px").css(this.wayFill, (multiply * this.size) + "px");
				$(inner).children(".carousel-endless-post").css(this.way, this.size + "px").css(this.wayFill, -this.size + "px");
			}
			this.toggleArrows();
		};

		/**
		 * Create arrows
		 * @param {String} element
		 */
		this.createArrows = function (element) {
			if (!element || $("#" + element).length === 0) {
				this.elmArrow = $('<div' + (element ? ' id="' + element + '"' : '') + ' class="' + this.arrowsClass + '">' +
					'<a href="#" class="' + this.arrowsClass + '-left"></a><a href="#" class="' + this.arrowsClass + '-right"></a></div>');
				$(this).after(this.elmArrow);
			}
			else if (element) {
				this.elmArrow = $("#" + element);
			}

			// add actions
			$(this.elmArrow).find('.' + this.arrowsClass + '-left').click( function (e) {
				e.preventDefault();
				self.showNext(false);
			});
			$(this.elmArrow).find('.' + this.arrowsClass + '-right').click( function (e) {
				e.preventDefault();
				self.showNext(true);
			});

			this.toggleArrows();
		};

		/**
		 * Create pager
		 * @param {String} element
		 * @param {String} elClass
		 * @param {Integer} perPage
		 */
		this.createPager = function (element, elClass, perPage) {
			var pages = Math.ceil(this.count / perPage);
			if (!element || $("#" + element).length === 0) {
				this.elmPager = $('<div' + (element ? ' id="' + element + '"' : '') + (elClass ? ' class="' + elClass + '"' : '') + '></div>');
				for (var i = 0; i < pages; i++) {
					$(this.elmPager).append('<a href="#"><span>' + (i+1) + '</span></a>');
				}
				$(this.elmPager).children("a:first-child").addClass("active");
				$(this).after(this.elmPager);
			}
			else if (element) {
				this.elmPager = $("#" + element);
			}

			// add actions
			$(this.elmPager).find("a").click( function (e) {
				e.preventDefault();
				var num = Number.parseInt($(this).children('span').text()) - 1;
				$(self.elmPager).children("a").removeClass("active");
				$(this).addClass("active");
				self.showNum(num * perPage);
			});
			this.initPause(this.elmPager);
		};

		/**
		 * (De)Activate arrows
		 */
		this.toggleArrows = function () {
			if (!this.endless && this.elmArrow !== null) {
				var position = Math.round(this.getPosition($(this).children()));
				$(this.elmArrow).find("a").removeClass('disabled');
				if (position >= 0) $(this.elmArrow).find("." + this.arrowsClass +"-left").addClass("disabled");
				if ((this.viewSize - position) >= this.size) {
					$(this.elmArrow).find("." + this.arrowsClass +"-right").addClass("disabled");
				}
			}
		};

		/**
		 * Pause timer on hover
		 * @param {DOMelement} element
		 */
		this.initPause = function (element) {
			if (this.pause) {
				$(element).hover(
					function () { self.timer.pause(); },
					function () { self.timer.play(); }
				);
			}
		};

		/**
		 * Move view to new position
		 * @param {DOMelement} element
		 * @param {Integer} move
		 * @param {Integer} position
		 * @param {Boolean} skip
		 */
		this.animateTo = function (element, move, position, skip) {
			if (this.cssOnly || skip === true) {
				$(element).css(this.way, move + "px").css(this.wayFill, -move + "px");
				setTimeout( function () { self.toggleArrows();}, 200);
			}
			else {
				var param = {};
				param[this.way] = move + "px";
				param[this.wayFill] = -move + "px";
				$(element).animate(param, self.speed * Math.abs(-move + position), function () {
					self.toggleArrows();
				});
			}
		};

		/**
		 * Move view to next/previous item based on direction
		 * @param {Boolean} direction
		 */
		this.showNext = function (direction) {
			var inner = $(this).children();
			$(inner).finish();

			var space = 0;

			// how much move
			if (parseInt(this.move) === this.move) {
				space = this.getItemSize(this.findFirstVisible(direction)) * this.move;
			}
			else if (this.move.indexOf("%") > 0) {
				var percent = parseFloat(this.move.replace(/[^\d.]/g, ''));
				space = this.viewSize * percent / 100;
			}
			else {
				space = this.move;
			}

			this.tryMove(inner, direction ? space : -space, false);
		};

		/**
		 * Try to move view
		 * @param {DomElement} inner
		 * @param {Numeric} space
		 * @param {Boolean} skip
		 */
		this.tryMove = function (inner, space, skip) {
			var move = 0;
			var position = this.getPosition(inner);

			if (this.endless) {
				if (space < 0 && position > 0) {
					position = position - (Math.ceil(position / this.size) * this.size);
					this.animateTo(inner, position, 0, true);
				}
				else if (space > 0 && (position - space) <= -this.size) {
					position = position - (Math.floor(position / this.size) * this.size);
					this.animateTo(inner, position, 0, true);
				}
			}

			// direction
			if (space > 0) {
				if (this.endless || (-position + space + this.viewSize) < (this.size - this.borderTolerance)) move = position - space;
				else move = -this.size + this.viewSize;
			}
			else {
				if (this.endless || position - space < -this.borderTolerance) move = position - space;
			}

			if (this.endless || move <= 0) {
				this.animateTo(inner, move, position, skip);
			}
			if (this.timer) this.timer.restart();
		};

		/**
		 * Move view to selected item
		 * @param {Integer} show
		 * @returns {Boolean}
		 */
		this.showNum = function (show) {
			if (show > 0) show -= this.imgFix;
			if (show >= this.count) return false;

			var move = 0;
			var position = this.getPosition($(this).children());

			if (this.size > this.viewSize) {
				var selectPosition = this.getPosition($(this).find(this.item)[show]);
				if (this.size < (selectPosition + (this.viewSize / 2))) move = -this.size + this.viewSize;
				else if ((this.viewSize / 2) < selectPosition) move = (this.viewSize / 2) - selectPosition;
			}

			this.animateTo($(this).children(), move, position);
			return true;
		};

		/**
		 * Returns element position
		 * @param {DOMelement} item
		 * @returns {Number}
		 */
		this.getPosition = function (item) {
			return Math.round($(item).position()[this.way]);
		};

		/**
		 * Returns width/height of selected element based on orientation
		 * @param {DOMelement} item
		 */
		this.getItemSize = function (item) {
			if (this.vertical) return $(item).outerHeight(true);
			return $(item).outerWidth(true);
		};

		/**
		 * Returns first visible item in carousel view
		 * @returns {DOMelement}
		 */
		this.findFirstVisible = function (direction) {
			var position = Math.abs(this.getPosition($(this).children()));
			var pages = $(this).find(this.item);
			for (var i = 0; i < pages.length; i++) {
				if (position <= Math.ceil(this.getPosition($(pages).eq(i)))) return $(pages).eq(i);
			}
			return $(pages).eq(direction ? 0 : this.count - 1);
		};

		if (this.init(this.sameSize)) {
			if (option['arrows'] === undefined || option['arrows'] !== false) this.createArrows(typeof option['arrows'] === "boolean" ? "" : option['arrows']);
			if (option['pager'] !== undefined && option['pager'] !== false) this.createPager(typeof option['pager'] === "boolean" ? "" : option['pager'], option['pagerClass'] !== undefined ? option['pagerClass'] : null, option['perPage'] !== undefined ? option['perPage'] : 1);
			if (this.pause) {
				this.timer = new Timer(function(){ self.showNext(true); }, this.pause);
				this.initPause(this);
			}

			$(window).resize( function () {
				self.init(self.sameSize);
				if (self.viewSize - self.getPosition($(self).children()) > self.size) {
					self.animateTo($(self).children(), self.viewSize > self.size ? 0 : self.viewSize - self.size, 0, true);
				}
				self.toggleArrows();
			});
		};

		/**
		 * Get new position for swipe
		 * @param {UIEvent} e
		 * @returns {Number}
		 */
		this.getEventPosition = function (e) {
			if (window.TouchEvent && e.originalEvent instanceof TouchEvent) e = e.originalEvent.touches[0];
			return this.way === "top" ? e.clientY : e.clientX;
		};

		if (option['swipe'] !== false) {
			$(this).on("dragstart", function (e) {
				e.preventDefault();
			});
			$(this).on("touchstart mousedown", function (e) {
				$(self).children().addClass("carousel-nomination");
				self.isSwiping = false;
				self.position = self.getEventPosition(e);
			});
			$(this).on("touchmove mousemove",  function (e) {
				if (self.position && self.position !== false) {
					var old = self.position;
					self.isSwiping = true;
					self.position = self.getEventPosition(e);
					self.tryMove($(this).children(), old - self.position, true);
				}
			});
			$(this).on("touchend mouseup mouseleave", function (e) {
				$(self).children().removeClass("carousel-nomination");
				self.position = null;
			});
			$(this).on("click", function (e) {
				if (self.isSwiping) e.preventDefault();
			});
		}

		// public functions
		return {
			getCount: function () { return self.count; },
			pause: function () { if (self.pause) self.timer.pause(); },
			play: function () { if (self.pause) self.timer.play(); },
			showNum: function (num) { self.showNum(num); },
			showNext: function (direction) { self.showNext(direction); }
		};
	};
}(jQuery));
