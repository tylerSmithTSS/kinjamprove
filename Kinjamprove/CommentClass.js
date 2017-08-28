var Comment = function(commentElem) {
	var parentCommentSelector;
	var parentComment;
	var depth;
	
    this.element = (commentElem instanceof $) ? commentElem : $(commentElem);
    this.id = this.element.attr('id');
    this.dataId = this.element.attr('data-id');
    this.dataParentId = this.element.attr('data-parentid');
    this.dataAuthorname = this.element.attr('data-authorname');

    parentCommentSelector = '#reply_' + this.dataParentId;
    parentComment = $(parentCommentSelector); 
    
    this.parentComment = parentComment.length ? parentComment : null;

    if (this.parentComment === null) {
    	depth = 0;
    } else {
    	var parentDepth = Number.parseInt(this.parentComment.attr('depth'));
    	depth = parentDepth + 1;
    }
    this.element.attr('depth', depth);
    this.depth = depth;
    
    var temp = [];
    var repliesSelector = 'article[data-parentid="' + this.dataId + '"]'
    var $replies = $(repliesSelector);
    $replies.each(function() {
		var $reply = new Comment(this);
		temp.push($reply);
    });

	this.replies = temp;
}


Comment.prototype = {
	attachChildrenRepliesAfter: function() {
		if (!this.replies.length) {
			return;
		}
		for (var i = this.replies.length-1; i >= 0; i--) {
			this.replies[i].attachReplyAfterParentComment();
			this.replies[i].attachChildrenRepliesAfter();
		}
	},

	attachReplyAfterParentComment: function() {
		if (!this.parentComment) {
			return;
		}
		var $parentCommentEditorPlaceholder = this.parentComment.siblings('div.js_editor-placeholder');
		$parentCommentEditorPlaceholder.after(this.element.parent());
	},

	collapseThread: function() {
		this.element.children(':not(header, div.js_reply-flagged, svg)').hide();
		
		if (this.depth === '0') {
			this.element.attr('collapsed', 'true');
		}	

		this.element.siblings('li').hide();
		this.element.find('a.collapse-thread-button')
			.text('+')
			.attr('title', 'Expand');
	},

	expandThread: function() {		
		if (this.depth === '0') {
			this.element.attr('collapsed', 'false');
		}

		this.element.parent()
			.find(':not(header, div.js_reply-flagged, svg, a.collapse-thread-button, div.parent-comment-tooltip, span.reply__pending-label:not(".hide-for-small"))')
				.show()
			.find('a.collapse-thread-button')
				.text('–')
				.attr('title', 'Collapse');
	},

// 	sortRepliesMostLikesFirst: function() {
// 		if (!this.replies.length) 
// 			return;
// 		
// 		this.replies.sort(function(a, b) {
// 			return b.likes - a.likes;
// 		});
// 	},
// 	
// 	sortRepliesOldestFirst: function() {
// 		if (!this.replies.length) 
// 			return;
// 		
// 		this.replies.sort(function(a, b) {
// 			return a.publishDate - b.publishDate;
// 		});
// 	},
// 
// 	sortRepliesNewestFirst: function() {
// 		if (!this.replies.length) 
// 			return;
// 		
// 		this.replies.sort(function(a, b) {
// 			return b.publishDate - a.publishDate;
// 		});
// 	}

};