var kinjamproveButtonHTML = '<a class="kinjamprove-button">Kinjamprove!</a>';
var kinjamproveButtonContainerHTML = '<div class="kinjamprove-button-container">' + kinjamproveButtonHTML + '</div>';
var toggleThreadButton = {
	className: 'collapse-thread-button',
	collapse: {
		title: 'Collapse',
		innerText: '–',
		outerHTML: '<a class="collapse-thread-button" title="Collapse">–</a>'
	},
	expand: {
		title: 'Expand',
		innerText: '+',
		outerHTML: '<a class="collapse-thread-button" title="Expand">+</a>'
	}
};

function addStyleToPage(sourceFileName) {
	var sourcePath = 'chrome-extension://' + chrome.runtime.id + '/' + sourceFileName;
	if ($('head > link[href*="' + sourcePath + '"]').length) {
		return;
	}
	
	var style = document.createElement('link');
	style.type = 'text/css';
	style.href = sourcePath;
	style.rel = 'stylesheet';
	style.id = 'kinjamprove-' + sourceFileName.substring(0, sourceFileName.indexOf('.'));
	document.head.appendChild(style);
}

$(document).ready(function() {
	
	// add comments.css to page 
	addStyleToPage('comments.css');
	
	var discussionRegionObserver = new MutationSummary({
		callback: updateDiscussionRegion,
		queries: [
			{
				element: 'article.reply'
			},
			{
				element: 'div.discussion-header'
			}
			,
			{
				element: 'a[value="pending"]'
			}
		]
	});
});	
	
function updateDiscussionRegion(summaries) {
	var commentsSummary = summaries[0];
	var discussionHeadersSummary = summaries[1];
	var pendingDiscussionFilterSummary = summaries[2];
	var kinjamproveDiscussionRegionSelector = '.js_discussion-region[kinjamprove="on"]';

	commentsSummary.added.forEach(commentAdded);
	discussionHeadersSummary.added.forEach(function(discussionHeader) {
		$(discussionHeader).append(kinjamproveButtonContainerHTML);
// 		var $discussionHeader = $(discussionHeader);
// 		var dataReplyCountTotal = Number.parseInt($discussionHeader.attr('data-reply-count-total'));
// 		console.log('dataReplyCountTotal=' + dataReplyCountTotal);
// 		if (dataReplyCountTotal) {
// 		 	$discussionHeader.append(kinjamproveButtonHTML);
// 		 }
	});
	
	pendingDiscussionFilterSummary.added.forEach(function(pendingFilter) {
		var $pendingFilter = $(pendingFilter);
		var $discussionRegion = $pendingFilter.closest('section.js_discussion-region');
		var pendingReplyCount = Number.parseInt($discussionRegion.attr('data-reply-count-pending'));
		var pendingFilterInnerText;
		
		if (isNaN(pendingReplyCount)) {
			return;
		}
		
		pendingFilterInnerText = $pendingFilter.text() + ' (' + pendingReplyCount + ')';
		$pendingFilter.text(pendingFilterInnerText);
	});

// 	console.log('commentsSummary: ', commentsSummary);

	$('a.kinjamprove-button').click(function() {
		var $discussionRegion = $(this).closest('section.js_discussion-region');
// 		var $pendingDiscussionFilter = $(this).parent().prev().find('a:contains("Pending"):first');
		var $pendingDiscussionFilter = $(this).parent().prev().find('a[value="pending"]:first');
		var $pendingReplyButton;
		var animationStartTime = null;
		var pendingReplyCount;
		var $visibleHideRepliesFooters;
		var $depth0CommentsToRethread;
		
		if (!$discussionRegion.attr('kinjamprove') || $discussionRegion.attr('kinjamprove') !== 'on') {
			$pendingDiscussionFilter.click(pendingDiscussionFilterOnClick.bind(this));	// this = a.kinjamprove-button
			$pendingDiscussionFilter[0].click();
			$discussionRegion.attr('kinjamprove', 'on');
			pendingReplyCount = Number.parseInt($discussionRegion.attr('data-reply-count-pending'));
			console.log('pendingReplyCount=' + pendingReplyCount);
		} else {		
			$(kinjamproveDiscussionRegionSelector + ' article').on({
				mouseover: function() {
					$(this).find('a.collapse-thread-button').show();
				},
				mouseout: function() {
					$(this).find('a.collapse-thread-button').hide();
				} 
			});
			
			$visibleHideRepliesFooters = $discussionRegion.find('footer:parent(a.js_close-replies:visible)');
			$depth0CommentsToRethread = $visibleHideRepliesFooters.closest('li').children('article[depth=0][threaded!="true"]');
			
			$visibleHideRepliesFooters.hide();			
			$depth0CommentsToRethread.each(function() {
				nestReplies(this);
				this.setAttribute('threaded', true);
			});		
		}
		
		function pendingDiscussionFilterOnClick(animationStartTime) {
// 				console.log('PENDING DISCUSSION FILTER ONCLICK: ', this);
			
			if (!animationStartTime) {
				animationStartTime = window.performance.now();
			}
			
			window.requestAnimationFrame(clickShowPendingOnAvailable);
			
			/* TODO: fix animationStartTime so that it's just a time like it's
			* supposed to be, and not a jQuery Event object (as it is, the
			* else if will never be reached, which could lead to possible
			* infinite looping D:!
			*/
			function clickShowPendingOnAvailable(time) {
				$pendingReplyButton = $discussionRegion.find('.alert-box.filtered-view:not(".hide") .button-container > a');
				
				if ($pendingReplyButton && $pendingReplyButton.length) {
					$pendingReplyButton[0].click();
// 					console.log('animationStartTime: ', animationStartTime);
// 					console.log('current time: ', window.performance.now());
				} else if (window.performance.now() >= animationStartTime + 5000) { 
					console.log('current time=' + window.performance.now() + ', animationStartTime=' + animationStartTime +'; canceling clickShowPendingOnAvailable.');	
					window.cancelAnimationFrame(clickShowPendingOnAvailable);
				} else {
					window.requestAnimationFrame(clickShowPendingOnAvailable);
				}
			} // end of clickShowPendingOnAvailable function
		} // end of pendingDiscussionFilterOnClick function
   }); // end of kinjamprove button onclick

	addCollapseThreadOnClick();
	addShowMoreRepliesOnClicks();
	
	$(kinjamproveDiscussionRegionSelector + ' article').on({
		mouseover: function() {
			$(this).find('a.collapse-thread-button').show();
		},
		mouseout: function() {
			$(this).find('a.collapse-thread-button').hide();
		} 
	});
	
	var visibleShowMoreRepliesSelector = kinjamproveDiscussionRegionSelector 
										+ ' a.js_load-all-replies:not(".hide")';
	var $visibleShowMoreReplies = $(visibleShowMoreRepliesSelector);
	
	if ($visibleShowMoreReplies.length) {
		$visibleShowMoreReplies[0].click();
	} 
	

	var $shortThreadDepth0Comments = 
			$('.js_discussion-region[kinjamprove="on"] footer:hidden')
			.closest('.js_region--children')
			.siblings('article[depth=0][threaded!="true"]');
			
	$shortThreadDepth0Comments.each(function() {
		nestReplies(this);
		this.setAttribute('threaded', true);
	});

	function addShowMoreRepliesOnClicks() {
		var $visibleShowMoreReplies = $(kinjamproveDiscussionRegionSelector + ' a.js_load-all-replies:not(".hide")');
		var $showMoreRepliesLabel;

		$visibleShowMoreReplies.off('click');
		$visibleShowMoreReplies.click(showMoreRepliesOnClick);

		function showMoreRepliesOnClick() {
			var showMoreRepliesLabelText;
			
			if (!$showMoreRepliesLabel) {
				$showMoreRepliesLabel = $(this);	
			}

			showMoreRepliesLabelText = $showMoreRepliesLabel.parent()[0].innerText;

			if (showMoreRepliesLabelText.indexOf('Hide') > -1) {
				var $parentThreadFirstComment = $showMoreRepliesLabel.parentsUntil('ul').children('article:first');
				nestReplies($parentThreadFirstComment[0]);
				$parentThreadFirstComment.attr('threaded', true);

				$showMoreRepliesLabel.closest('footer').remove();
			} else {
				window.requestAnimationFrame(showMoreRepliesOnClick);
			}
		} // end of showMoreRepliesOnClick function
	} // end of addShowMoreRepliesOnClicks function
} // end of updateDiscussionRegion function


function nestReplies($comment) {
	var comment = new Comment($comment);
	comment.attachChildrenRepliesAfter();
}

function commentAdded(comment) {
	if (comment.attributes.getNamedItem('depth') !== null) 
		return;

	var id = comment.attributes.getNamedItem('id').nodeValue;
	var parentId = comment.attributes.getNamedItem('data-parentid').nodeValue;
	var depth;
	var $post = $('#post_' + parentId);
	var $comment = $('#' + id);	
	var $publishTimeByline = $comment.find('.reply__publish-time');

	if ($post.length && parentId === $post.attr('data-id')) {
		depth = 0;
	} else {
		var $parentComment = $('#reply_' + parentId);
		var parentDepth = $parentComment.attr('depth');
		depth = Number.parseInt(parentDepth) + 1;
	}

	$comment.attr('depth', depth);
	$publishTimeByline.append(toggleThreadButton.collapse.outerHTML);
}

function addCollapseThreadOnClick() {			
	var collapseThreadButtonSelector = '.js_discussion-region[kinjamprove="on"] a.' + toggleThreadButton.className;
	$(collapseThreadButtonSelector).off('click');

	$(collapseThreadButtonSelector).click(function() {
		var $parentReplyQuery = $(this).closest('article[depth]'); 
		var id = $parentReplyQuery.attr('data-id');
		var parentReplyComment = new Comment(id);

		if (this.innerText.indexOf(toggleThreadButton.collapse.innerText) > -1) {
			parentReplyComment.collapseThread();
		} else {
			parentReplyComment.expandThread();
		}
	}); 
} // end addCollapseThreadOnClick function
