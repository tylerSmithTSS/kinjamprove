var Comment = class  {
    constructor(id, parentCommentId, depth, 
    			authorName, authorHandle, parentHandle,
				publishDate, likeCount) {
		if (arguments.length === 1) {
			var reply;
			
			if (typeof arguments[0] === 'object') {
				reply = arguments[0];	
        	} else {
        		var replySelector = arguments[0];
        		
        		try { 
					if (replySelector.startsWith("reply_")) {
						replySelector = "#" + replySelector;
					} else if (!replySelector.startsWith("#")) {
						replySelector = "#reply_" + replySelector;
					}
					reply = $(replySelector)[0];		
        		}
        		catch(error) {
        			console.error('ERROR: ', error);
//         			console.log('arguments[0]: ', arguments[0]);
        		}						
        	}
        	
        	setConstructorArgumentsFromReply(reply);
        	
        	function setConstructorArgumentsFromReply(reply) {
				var innerText = reply.innerText.split('\n'),
					attributes = reply.attributes;
					
				id = attributes.getNamedItem('data-id').nodeValue;
				parentCommentId = attributes.getNamedItem('data-parentid').nodeValue;
				authorName = attributes.getNamedItem('data-authorname').nodeValue;
				depth = attributes.getNamedItem('depth');
					
				if (depth) {
					depth = depth.nodeValue;
                }
				else {
					let parentQuery = $('#reply_' + parentCommentId);
					if (!parentQuery.length) {
						depth = '0';
					} else {
                   		let parent = parentQuery[0];
                        let parentDepth = parent.attributes.getNamedItem('depth');

                        if (parentDepth) {
                            parentDepth = parentDepth.nodeValue;
                            depth = Number.parseInt(parentDepth) + 1;
                        } else { 
                            depth = '0';
                        }
                    }					
                }	
					
				authorHandle = innerText[1];
				parentHandle = innerText[2];
				
				let publishDateQuery = $('#reply_' + id + ' .published.updated');
				let publishDateTemp = publishDateQuery[0].innerText;
				publishDateTemp = publishDateTemp.slice(0, -2) + ' ' + publishDateTemp.slice(-2);
				publishDate = new Date(publishDateTemp);
								
				let likeCountQuery = $('#reply_' + id + ' span.like-count');
				likeCount = likeCountQuery.length ? Number.parseInt(likeCountQuery[0].innerText) : 0;
			} // end of setConstructorArgumentsFromReply function
        } // end of setConstructorArgumentsFromReply function 
		this._id = id;
		this._parentCommentId = parentCommentId;
		this._depth = depth;
		this._authorName = authorName;
		this._authorHandle = authorHandle;
		this._parentHandle = parentHandle;
		this._publishDate = publishDate;
		this._likeCount = likeCount;
		this._replies = this.getChildRepliesArrayAsComments();
		if (!this._replies) {
			this._replies = [];
		}
	}
	
	get id() { return this._id; }
	get parentId() { return this._parentCommentId; }
	get depth() { return this._depth; }
	get authorName() { return this._authorName; }
	get authorHandle() { return this._authorHandle; }
	get parentHandle() { return this._parentHandle; }
	get selector() { return '#reply_' + this._id; }
	get parentCommentSelector() { return '#reply_' + this._parentCommentId; }
	get publishDate() { return this._publishDate; }
	get likeCount() { return this._likeCount; }
	get replies() { return this._replies; }
	
	getDescendants() {
		var threadStartingAtCurrentComment = this.getThreadStartingWithThis();
		var descendants = threadStartingAtCurrentComment.slice(1);
		
		return descendants;
    } // end getDescendants()
	
	getThreadStartingWithThis() {
		var descendants = [this];
		var repliesLength = this.replies.length;
		if (repliesLength) {
			for (var i = 0; i < repliesLength; i++) {
                var temp = this.replies[i].getThreadStartingWithThis();
                descendants = descendants.concat(temp);
        	}
        }
		return descendants;
    }
	// "Oldest" (old -> new) [default] ("07/01/2017 4:45:50 pm" < "07/01/2017 8:19:31 pm"
	getThreadStartingWithThisAsc() {
		var descendants = [this];
		var repliesLength = this.replies.length;

		if (repliesLength) {
			var repliesAsc = this.replies.sort(function (a, b) {
        		return a.publishDate - b.publishDate;
       		});

			for (var i = 0; i < repliesLength; i++) {
                var temp = repliesAsc[i].getThreadStartingWithThis();
                descendants = descendants.concat(temp);
        	}
        }
		return descendants;
    }

	// "Newest" (new -> old)
	getThreadStartingWithThisDesc() {
		var descendants = [this];
		var repliesLength = this.replies.length;

		if (repliesLength) {
			var repliesDesc = this.replies.sort(function (a, b) {
        		return b.publishDate - a.publishDate;
       		});

			for (var i = 0; i < repliesLength; i++) {
                var temp = repliesDesc[i].getThreadStartingWithThis();
                descendants = descendants.concat(temp);
        	}
        }
		return descendants;
    }

	// get thread from highest likeCount to lowest
	getThreadStartingWithThisBest() { 
		var descendants = [this];
		var repliesLength = this.replies.length;

		if (repliesLength) {
			var repliesDesc = this.replies.sort(function (a, b) {
        		return b.likeCount - a.likeCount;
       		});

			for (var i = 0; i < repliesLength; i++) {
                var temp = repliesDesc[i].getThreadStartingWithThis();
                descendants = descendants.concat(temp);
        	}
        }
		return descendants;
    }

	// get descendants oldest first
	getDescendantsAsc() {
		var descendants = this.getThreadStartingWithThisAsc();
		return descendants.slice(1);
    }

	// get descendants newest first
	getDescendantsDesc() { 
		var descendants = this.getThreadStartingWithThisDesc();
		return descendants.slice(1);
    }

	// get descendants sorted by most popular (from higher likeCount to lower)
	getDescendantsBest() { 
		var descendants = this.getThreadStartingWithThisBest();
		return descendants.slice(1);
    }

	getSiblingsInclusive() {
		var siblings = [];
		var siblingsQuery = $('article[data-parentid="' + this.parentId + '"]');
		for (var i = 0; i < siblingsQuery.length; i++) {
			let siblingID = siblingsQuery[i].attributes.getNamedItem('id').nodeValue;
			siblings.push(new Comment(siblingID));
        }
		return siblings;
    }
	
	attachChildrenRepliesAfter_sortedByBest() {
		var replies = this.getRepliesSortedByBest();
		this.attachChildrenRepliesAfter(replies);
	}
	
	attachChildrenRepliesAfter_sortedByNewest() {
		var replies = this.getRepliesNewestFirst();
		this.attachChildrenRepliesAfter(replies);
	}
	
	attachChildrenRepliesAfter_sortedByOldest() {
		var replies = this.getRepliesOldestFirst();
		this.attachChildrenRepliesAfter(replies);
	}
	
	attachChildrenRepliesAfter(sort) {
		var replies;
		if (!arguments.length) {
			sort = 'desc';
		}
		
		switch(sort) {
			case 'popularity': replies = this.getRepliesSortedByBest(); break;
			case 'asc': 	   replies = this.getRepliesOldestFirst(); break;
			case 'desc':	   replies = this.getRepliesNewestFirst(); 
		}
		
		if (replies === null)
			return;
			
		for (var i = replies.length-1; i >= 0; i--) {
			var reply = replies[i];
			reply.attachReplyAfterParentComment();
			reply.attachChildrenRepliesAfter(sort);
		}
	}
	
	getRepliesSortedByBest() {
		var replies = this.getChildRepliesArrayAsComments();
		if (replies === null)
			return null;
		
		return Comment.sortCommentsBestFirst(replies);	
		
		replies.sort(function (a, b) {
        	return b.likeCount - a.likeCount;
       	});	
       	return replies;
	}
	
	// Descending order
	getRepliesNewestFirst() {
		var replies = this.getChildRepliesArrayAsComments();
		
		return replies !== null ? Comment.sortCommentsNewestFirst(replies) : null;
	}
	
	// Ascending order
	getRepliesOldestFirst() {
		var replies = this.getChildRepliesArrayAsComments();
		if (replies === null)
			return null;
		
		return Comment.sortCommentsOldestFirst(replies);
		
		replies.sort(function (a, b) {
        	return a.publishDate - b.publishDate;
       	});	
       	
       	return replies;
	}
	
	attachReplyAfterParentComment() {
// 		$(this.parentCommentSelector).after($(this.selector));
		
		var reply = detachParent(this.selector),
			replyParentComment = $(this.parentCommentSelector);
		
		
// 		replyParentComment.after(reply);

		$(this.parentCommentSelector + ' ~ div.js_editor-placeholder').after(reply);
		
		function detachParent(selector) {
			return $(selector).parent().detach();
		}
	}
	
	collapseThread() {
		var $this = $(this.selector);
		
		$this.children(':not(header, div.js_reply-flagged)').hide();
		if (this.depth === '0') {
			$(this.selector + ' img:first').css({'height' : '30px', 'width' : '30px'});
		}
		
		$this.siblings('li').hide();
		$this.find(' a.collapse-thread-button')
			.text('+')
			.attr('title', 'Expand');
    }
	
	expandThread() {		
		if (this.depth === '0') {
			$(this.selector + ' img:first').css({'height' : '40px', 'width' : '40px'});
		}

		$(this.selector).parent()
			.find(' :not(header, div.js_reply-flagged, svg.svg-checkmark--small, span.reply__pending-label:not(".hide-for-small"))')
				.show()
			.find('a.collapse-thread-button')
				.text('–')
				.attr('title', 'Collapse');
	}
		
	getChildReplyIdsArray() {
		return $('[data-parentid="' + this._id + '"]');
	}
	
	getChildRepliesArrayAsComments() {
		var repliesArr = $('[data-parentid="' + this._id + '"]');
		if (!repliesArr.length)
			return null; 
		var commentsArr = [];
		for (var i = 0; i < repliesArr.length; i++) {
			var reply = new Comment(repliesArr[i].id)
			commentsArr.push(reply);
			
        }
		return commentsArr;
	}

	toString() { 		
		return `[Comment object] { id: "reply_${this._id}", parentCommentId: "reply_${this._parentCommentId}", ` +
			`depth: ${this._depth}, authorName: "${this._authorName}", ` +
		 	`authorHandle: "${this._authorHandle}", parentHandle: "${this._parentHandle}" }`;
	}	
	
	valueOf() {
		return $(this.selector)[0];
	}
	
	
	static reattachDepth0CommentsInOrder(commentsArr) {
    	var commentsUnorderedList = $(commentsArr[0].selector).closest('ul');
    	for (var i = commentsArr.length-1; i >= 0; i--) {
    		var commentSelector = commentsArr[i].selector;
    		var commentListItemElem = $(commentSelector).parent();
    		
    		commentsUnorderedList.prepend(commentListItemElem);
    	}
    }
	
	static getSortedComments(commentsArr, sort) {
		switch (sort) {
			case 'popularity': return Comment.sortCommentsBestFirst(commentsArr);
			case 'desc': 	   return Comment.sortCommentsNewestFirst(commentsArr);
			case 'asc': 	   return Comment.sortCommentsOldestFirst(commentsArr);
		}
	}
	
	static sortCommentsBestFirst(commentsArr) {
		var temp = commentsArr.slice();
		
		temp.sort(function (a, b) {
        	return b.likeCount - a.likeCount;
       	});	
       	
       	return temp;
	}
	
	static sortCommentsNewestFirst(commentsArr) {
		var temp = commentsArr.slice();
		
		temp.sort(function (a, b) {
// 			return b.publishDate - a.publishDate;
        	return a.publishDate - b.publishDate;
       	});	
       	
       	return temp;
	}
	
	static sortCommentsOldestFirst(commentsArr) {
		var temp = commentsArr.slice();
		
		temp.sort(function (a, b) {
        	return b.publishDate - a.publishDate;
       	});	
       	
       	return temp;
	}
	
	static getArticleId() {
		return $('section.main > div > section.branch-wrapper > div.post-wrapper.js_post-wrapper:first article[data-id]')[0].attributes.getNamedItem('data-id').nodeValue;
    }
    
    static getRepliesWithParentId(parentId) {
		return $('[data-parentid="' + parentId + '"]');
	}
    
    static getDepth_0_comments() {
    	var depth_0_comments;
    	if (depth_0_comments) 
    		return depth_0_comments;
    	
    	var articleId = Comment.getArticleId(),
    		depth_0_repliesArr = Comment.getRepliesWithParentId(articleId);
    	depth_0_comments = [];
    	for (var i = 0; i < depth_0_repliesArr.length; i++) {
    		var comment = new Comment(depth_0_repliesArr[i]);
    		depth_0_comments.push(comment);
    	}
    	return depth_0_comments;
    }
    
    static getDepth_0_commentIds() {
    	var depth_0_ids;
    	if (!depth_0_ids) {    		
			depth_0_ids = [];
			var articleId = Comment.getArticleId(), 
				depth_0_repliesArr = Comment.getRepliesWithParentId(articleId);
			
			for (var i = 0; i < depth_0_repliesArr.length; i++) {
				var comment = new Comment(depth_0_repliesArr[i]);
				depth_0_ids.push(comment.id);
			}
    	}
    	return depth_0_ids;
    }
    
    
} // end of Comment class