(function(window){

	var document = window.document;

	var TPLS = {
		selectboxHtml:
			'<div class="QPUI-selectbox" hidefocus="true" tabindex="-1" style="{{style}}">'+
				'<div class="QPUI-selectbox-inner" data-value="{{value}}">{{textContent}}</div>'+
				'<i class="QPUI-selectbox-icon"></i>'+
			'</div>',

		dropdownHtml: '<div class="QPUI-dropdown-wrap"><dl class="QPUI-selectbox-dropdown" role="menu">{{options}}</dl><div>',
		optgroupHtml: '<dt class="QPUI-selectbox-optgroup">{{label}}</dt>',
		optionHtml: '<dd class="QPUI-selectbox-option {{className}}"  data-value="{{value}}" data-option="{{index}}" tabindex="-1">{{textContent}}</dd>'
	}
	/**
	 * 获取元素相对位置
	 * @param  {Object} field 元素
	 * @return {Object}       包含left和top
	 */
	function getPos(field, maxHeight){
		var p = field.offset(),
			scrollBarPos = $(window).height() + $(document).scrollTop();
			topPos = p.top + field.outerHeight(),
			leftPos = p.left;
		topPos = (topPos + maxHeight) > scrollBarPos ? (p.top - maxHeight -2) : topPos;
		return {
			top: topPos,
			left: leftPos
		};
	}
	/**
	 * 模板替换
	 * @param  {String} tpl  模板
	 * @param  {Object} data 数据
	 * @return {String}      拼接后的模板
	 */
	function _tpl(tpl, data) {
		return tpl.replace(/{{(.*?)}}/g, function ($1, $2) {
			return data[$2];
		});
	}
	/**
	 * 获取select option
	 * @param  {Object} select select元素
	 * @param  {Number} index  索引
	 * @return {Object}        索引元素
	 */
	function _getOption(select, index) {
		index = index === undefined ? select[0].selectedIndex : index;
		return select.find('option').eq(index);
	}

	
	/**
	 * 获取select信息
	 * @param  {Object} select select元素
	 * @return {Object}        select信息
	 */
	function getSelectInfo(select){

		var optionStr = '',
			selectIndex = select[0].selectedIndex,
			index = 0,
			selectData = select.data()


		function getOptionsData(options){
			options.each(function(){
				var that = $(this);
				var tplDate = $.extend({
					className: 'drapdown',
					index: index,
					value: that.val(),
					textContent: that.html()
				}, that.data(), selectData);

				optionStr += _tpl(TPLS.optionHtml, tplDate);
				index++;
			});
		}

		// 如果有分组 执行分组
		if (select.find('optgroup').length) {
			select.find('optgroup').each(function (index) {
				optionStr += _tpl(TPLS.optgroupHtml, {
					index: index,
					label: this.label
				});
				getOptionsData($(this).find('option'));
			});	
		}else{
			getOptionsData(select.find('option'));
		}
		// 获取选中
		var selectedOptions = _getOption(select);
		var selectboxHtml = _tpl(TPLS.selectboxHtml, {
			style: select.attr('style') || '', 
			textContent: selectedOptions.html() || '',
			value: selectedOptions.val()
		});

		return {
			'width': select.outerWidth(),
			'height': select.outerHeight(),
			'left': select.offset().left,
			'top': select.offset().top,
			'selectBox': selectboxHtml,
			'dropdown': _tpl(TPLS.dropdownHtml, {
				options: optionStr
			})
		}
	}
	/**
	 * select 类
	 * @param {Object} select select元素
	 * @param {Object} opts   配置项
	 */
	var Select = function(select, opts){
		var self = this;
		$.extend(TPLS, opts);

		self.select = select;

		self.openClass = opts.openClass;
		self.selectedClass = opts.selectedClass
		self.onClose = opts.onClose;

		self.isIE6 = !('minWidth' in select[0].style);

		self.init();
	}

	Select.prototype = {
		init: function(){
			var self = this;
			//
			var selectInfo = self.selectInfo = getSelectInfo(self.select);
			self.select.hide();

			self._selectBox = $(selectInfo.selectBox);
			self._value = self._selectBox.find('[data-value]');


			self._selectBox.css({
				width: selectInfo.width
			});

			self.select.after(self._selectBox);
			self.bind();
		},

		show: function(){
			var self = this,
				select = self.select,
				selectbox = self._selectBox,
				selectInfo = self.selectInfo;

			if (select[0].disabled || !select[0].length) {
				return false;
			};

			var ie6 = self.isIE6;

			var selectHeight = selectInfo.height;
			var topHeight = selectInfo.top - $(document).scrollTop();
			var bottomHeight = $(window).height() - topHeight - selectHeight;
			var maxHeight = Math.max(topHeight, bottomHeight) - 20;

			var _dropdown = self._dropdown = $(selectInfo.dropdown);
			var selectBoxPos = getPos(selectbox, maxHeight);
			_dropdown.css({
				'position': 'absolute',
				'top': selectBoxPos.top,
				'left': selectBoxPos.left
			});

			var children = _dropdown.children()
			children.css({
				minWidth: selectbox.innerWidth(),
				maxHeight: maxHeight,
				width: ie6 ? Math.max(selectbox.innerWidth(), children.outerWidth()) : 'auto',
				height: ie6 ? Math.min(maxHeight, children.outerHeight()) : 'auto',
				overflowY: 'auto',
				overflowX: 'hidden'
			});

			var selectIndex = select[0].selectedIndex;
			children.find('[data-option]').eq(selectIndex).addClass(self.selectedClass);

			selectbox.addClass(self.openClass);

			$('body').append(_dropdown);


			self._dropdown.delegate('[data-option]', 'click', function(){
				var index = $(this).attr('data-option');
				self.selected(index);
			});
		},
		close: function(){
			var self = this;			
			self._selectBox.removeClass(self.openClass);
			self.onClose && self.onClose.call(self);
			if(!self._dropdown){
				return
			}
			self._dropdown.undelegate();
			self._dropdown.remove();
			self._dropdown = null;
		},
		selected: function(index){
			var self = this;

			var st = _getOption(self.select, index);

			if (st.attr('disabled')) {
				return false;
			}

			self.select[0].selectedIndex = index;

			self._value.html(st.html());

			self.close();

		},
		bind: function(){
			var self = this;
			self._selectBox.on('click', function(){
				self.click();
			});

			// 点击空白处关闭
			$(document).on('click', function(ev){
				var target = ev.target || ev.srcElement;
				
				if (!target) {
					return;
				};

				do{
					if(target == self._selectBox[0] || !target || 
						(self._dropdown && target == self._dropdown[0])){
						return;
					}
				}
				while(target = target.parentNode);

				self.close();

			})
		},
		click: function(){
			var self = this;
			if (!self.select[0].disabled) {
				self._dropdown ? self.close() : self.show();
			};
		}

	}

	// 默认参数
	var DEFAULTCONFIG = {
		openClass: 'QPUI-selectbox-open',
		selectedClass: 'QPUI-selectbox-selected',
		onClose: function(){}
	}

	$.fn.selectbox = function(opts){
		opts = $.extend({}, DEFAULTCONFIG, opts);
		return this.each(function(){
			new Select($(this), opts);
		});
	}
})(this);