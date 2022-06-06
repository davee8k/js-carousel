/**
 * Jquery Carousel | options - sameSize	boolean; all images have same size - load only one image to find content size
 * min jquery version 1.9+
 *
 * @author DaVee8k
 * @version 0.37.0
 * @license WTFNMFPL 1.0
 */
(function ($) {
	$.fn.carousel = function (option) {
		var self = this;
		this.page = option['page'] !== undefined ? option['page'] : 'a';
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

		this.arrowsElm = null;
		this.pagerElm = null;
		this.size = 0;
		this.viewSize = 0;
		this.count = 0;
		this.borderTolerance = 20;
		this.imgFix = 0; // remove main image from position counter
		this.timer = false;

		/**
		 * Set corrent content width
		 * @param {Boolean} sameSize
		 * @returns {Boolean}
		 */
		this.init = function (sameSize) {
			this.viewSize = this.vertical ? $(this).height() : $(this).width();
			this.count = Math.ceil($(this).find(this.page).not(".carousel-endless-box " + this.page).length / this.rows);
			this.size = sameSize ? this.getItemSize($(this).find(this.page).first()) * this.count : this.getItemSize($(this).children());

			var imgs = $(this).find(this.page).find("img").not(".carousel-endless-box " + this.page + " img");
			if ($(imgs).length > 0) {
				this.size = 0;
				if (sameSize) {
					this.loadOneAll(imgs, 0);
				}
				else {
					var loaded = 0;
					$(imgs).each( function () {
						if ($(this).attr(self.vertical ? "height" : "width")) {
							self.size += self.getItemSize($(this).closest(self.page));
							if (++loaded >= self.count) self.finishInit();
						}
						else {
							var item = this;
							var img = new Image();
							$(img).one("load error", function() {
								self.size += self.getItemSize($(item).closest(self.page));
								if (++loaded >= self.count) self.finishInit();
							}).attr('src', $(item).data("src") || $(item).attr("src"));
						}
					});
				}
			}
			else self.finishInit();

			return this.count > 1;
		};

		/**
		 * Load only one image and multiply
		 * @param {DOM[]} imgs
		 * @param {Integer} index
		 */
		this.loadOneAll = function (imgs, index) {
			if (index < this.count) {
				var item = $(imgs).get(index);
				var img = new Image();
				$(img).one("load", function() {
					self.size = self.getItemSize($(item).closest(self.page)) * self.count;
					self.finishInit();
				}).one("error", function() {
					self.loadOneAll(imgs, index + 1);
				}).attr('src', $(item).data("src") || $(item).attr("src"));
			}
		};

		/**
		 * Activate arrows and duplicate content for endless mode
		 */
		this.finishInit = function () {
			if (this.endless) {
				var inner = $(this).children();
				var multiply = Math.max(1, Math.ceil(Math.floor(this.viewSize) / Math.ceil(this.size)));

				if ($(inner).children(".carousel-endless-box").length === 0) {
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
				this.elmArrow = $('<div ' + (element ? 'id="' + element + '"' : '') + ' class="' + this.arrowsClass + '">' +
					'<a href="#" class="' + this.arrowsClass + '-left"></a><a href="#" class="' + this.arrowsClass + '-right"></a></div>');
				$(this).after(this.elmArrow);
			}
			else {
				this.elmArrow = $("#" + element);
			}
			$(this.elmArrow).find('.' + this.arrowsClass + '-left').click( function () { return self.showNext(false); });
			$(this.elmArrow).find('.' + this.arrowsClass + '-right').click( function () { return self.showNext(true); });

			this.toggleArrows();
		};

		/**
		 * Create pager
		 * @param {String} element
		 * @param {String} elClass
		 */
		this.createPager = function (element, elClass, perPage) {
			var pages = Math.ceil(this.count / perPage);
			if ($("#" + element).length === 0) {
				$(this).after('<div id="' + element + '"' + (elClass ? ' class="' + elClass + '"' : '') + '></div>');
				for (var i = 0; i < pages; i++) {
					$("#" + element).append('<a href="#"><span>' + (i+1) + '</span></a>');
				}
				$("#" + element).children("a:first-child").addClass("select");
			}
			// add actions
			for (var i = 0; i < pages; i++) {
				$($('#' + element).find("a").get(i)).click( function () {
					self.showNum(($(this).children('span').text() - 1) * perPage);
					return false;
				});
			}
			this.initPause("#" + element);
		};

		/**
		 * (De)Activate arrows
		 */
		this.toggleArrows = function () {
			if (!this.endless && this.elmArrow !== null) {
				var position = Math.round(this.getPosition($(this).children()));
				$(this.elmArrow).find("a").removeClass('disabled');
				if (position >= 0) $(this.elmArrow).find("." + this.arrowsClass +"-left").addClass('disabled');
				if ((this.viewSize - position) >= this.size) {
					$(this.elmArrow).find("." + this.arrowsClass +"-right").addClass('disabled');
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
		 *
		 * @param {DOMelement} element
		 * @param {int} move
		 * @param {int} position
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
		 *
		 * @param {Boolean} direction
		 * @returns {Boolean}
		 */
		this.showNext = function (direction) {
			var inner = $(this).children();
			$(inner).finish();

			var move = 0;
			var space = 0;
			var position = this.getPosition(inner);

			// how much move
			if (parseInt(this.move) === this.move) {
				space = this.getItemSize(this.findFirstVisible());
			}
			else if (this.move.indexOf("%") > 0) {
				var percent = parseFloat(this.move.replace(/[^\d.]/g, ''));
				space = this.viewSize * percent / 100;
			}
			else {
				space = this.move;
			}

			if (this.endless) {
				if (!direction && position > 0) {
					position = position - (Math.ceil(position / this.size) * this.size);
					this.animateTo(inner, position, 0, true);
				}
				else if (direction && (position - space) <= -this.size) {
					position = position - (Math.floor(position / this.size) * this.size);
					this.animateTo(inner, position, 0, true);
				}
			}

			// direction
			if (direction) {
				if (this.endless || (-position + space + this.viewSize) < (this.size - this.borderTolerance)) move = position - space;
				else move = -this.size + this.viewSize;
			}
			else {
				if (this.endless || position + space < -this.borderTolerance) move = position + space;
			}

			if (this.endless || move <= 0) {
				this.animateTo(inner, move, position);
			}
			if (this.timer) this.timer.restart();
			return false;
		};

		/**
		 *
		 * @param {int} show
		 * @returns {Boolean}
		 */
		this.showNum = function (show) {
			if (show > 0) show -= this.imgFix;
			if (show >= this.count) return false;

			var move = 0;
			var position = this.getPosition($(this).children());

			if (this.size > this.viewSize) {
				var selectPosition = this.getPosition($(this).find(this.page)[show]);
				if (this.size < (selectPosition + (this.viewSize / 2))) move = -this.size + this.viewSize;
				else if ((this.viewSize / 2) < selectPosition) move = (this.viewSize / 2) - selectPosition;
			}

			this.animateTo($(this).children(), move, position);
			return false;
		};

		/**
		 *
		 * @param {DOMelement} element
		 * @returns {float}
		 */
		this.getPosition = function (element) {
			return $(element).position()[this.way];
		};

		/**
		 *
		 * @param {DOMelement} item
		 */
		this.getItemSize = function (item) {
			if (this.vertical) return $(item).outerHeight(true);
			return $(item).outerWidth(true);
		}

		/**
		 *
		 * @returns {DOMelement}
		 */
		this.findFirstVisible = function () {
			var position = Math.abs(this.getPosition($(this).children()));
			var pages = $(this).find(this.page);
			for (var i = 0; i < pages.length; i++) {
				if (position <= Math.ceil(this.getPosition($(pages).eq(i)))) return $(pages).eq(i);
			}
			return null;
		};

		if (this.init(this.sameSize)) {
			if (option['arrows'] === undefined || option['arrows'] !== false) this.createArrows(typeof option['arrows'] === "boolean" ? "" : option['arrows']);
			if (option['pager'] !== undefined && option['pager'] !== false) this.createPager(option['pager'], option['pagerClass'] !== undefined ? option['pagerClass'] : false, option['perPage'] !== undefined ? option['perPage'] : 1);
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

		// public functions
		return {
			pause: function () { if (self.pause) self.timer.pause(); },
			play: function () { if (self.pause) self.timer.play(); },
			showNum: function (num) { self.showNum(num); },
			showNext: function (direction) { self.showNext(direction); }
		};
	};
}(jQuery));