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


$(document).ready(function() {
			
	// add comments.css to page 
	addStyleToPage('comments.css');
	
	var chromeExtensionBaseUrl = 'chrome-extension://' + chrome.runtime.id + '/';
	var commentClassScriptSource = chromeExtensionBaseUrl + 'CommentClass.js';
	addScriptToPage(commentClassScriptSource);
	
	var discussionRegionObserver = new MutationSummary({
		callback: updateDiscussionRegion,
		queries: [
			{
				element: 'article.reply'
			},
			{
				element: 'div.discussion-header'
			},
			{
				element: 'a[value="pending"]'
			},
			{
				element: 'a[value="community"], a[value="staff"]'
			},
			{
				element: 'a.js_load-all-replies'
			}
		]
	});
});	

	
function updateDiscussionRegion(summaries) {
	var commentsSummary = summaries[0];
	var discussionHeadersSummary = summaries[1];
	var pendingDiscussionFilterSummary = summaries[2];
	var staffAndCommunityDiscussionFiltersSummary = summaries[3];
	var loadMoreRepliesButtonSummary = summaries[4];
	
	var kinjamproveDiscussionRegionSelector = '.js_discussion-region[kinjamprove="on"]';
	var $kinjamproveDiscussionRegions = $(kinjamproveDiscussionRegionSelector);
	var $visibleShowMoreReplies = $kinjamproveDiscussionRegions.find('a.js_load-all-replies:not(".hide")');
	
	commentsSummary.added.forEach(commentAdded);	
	discussionHeadersSummary.added.forEach(discussionHeaderAdded);
	pendingDiscussionFilterSummary.added.forEach(pendingDiscussionFilterAdded);
	loadMoreRepliesButtonSummary.added.forEach(loadMoreRepliesButtonAdded);
	
	$('a.kinjamprove-button').click(kinjamproveButtonOnClick);
	addCollapseThreadOnClick();		
	addKinjamproveCommentMouseEvents($kinjamproveDiscussionRegions);
		
	if ($visibleShowMoreReplies.length) {
		$visibleShowMoreReplies[0].click();
	} 

	nestThreadsWithFourOrLessReplies($kinjamproveDiscussionRegions);
		
	 addParentLinkMouseEvents();
} // end of updateDiscussionRegion function
	
	
function addAnchorToComment($article) {
    var articleId = $article.attr('data-id');
    var anchorId = 'comment-' + articleId;
    var anchorHTML = '<a class="comment-anchor" id="' + anchorId + '"></a>';

    $article.prepend(anchorHTML);
}
	
function addCollapseThreadOnClick() {			
	var collapseThreadButtonSelector = '.js_discussion-region[kinjamprove="on"] a.' + toggleThreadButton.className;
	var $collapseThreadButton = $(collapseThreadButtonSelector);
	$collapseThreadButton.off('click');

	$collapseThreadButton.click(collapseThreadButtonOnClick);

	function collapseThreadButtonOnClick() {
		var $parentReply = $(this).closest('article[depth]'); 
		var $parentReplyComment = new Comment($parentReply);
	
		if (this.innerText.indexOf(toggleThreadButton.collapse.innerText) > -1) {
			$parentReplyComment.collapseThread();
		} else {
			$parentReplyComment.expandThread();
			$('a.collapse-thread-button').css('visibility', 'none');
		}
	} // end of collapseThreadOnClick function

} // end addCollapseThreadOnClick function

function addKinjamproveCommentMouseEvents($discussionRegions) {
	var kinjamproveDiscussionRegionSelector = '.js_discussion-region[kinjamprove="on"]';

	$discussionRegions.on({
		mouseover: function() {
			$(this).find('a.collapse-thread-button').show();
		},
		mouseout: function() {
			$(this).find('a.collapse-thread-button').hide();
		} 
	}, 'article');
}

function addParentCommentLinkToComment($article) {
    if ($article.attr('depth') === '0') {
        return;
    }

    var dataParentId = $article.attr('data-parentid');
    var anchorId = 'comment-' + dataParentId;
    var linkHTML = '<a class="parent-comment-link" href="#' + anchorId + '"></a>';
    
    $article.find('header > span > span.reply__to-author').wrap(linkHTML);
}

function addParentLinkMouseEvents() {   
	var $parentLinks = $('.parent-comment-link'); 
	$parentLinks.on({
		'mouseover': parentLinkOnMouseOver,
	    'mouseout': parentLinkOnMouseOut
	});
	
	function parentLinkOnMouseOut() {
		$(this).children('.parent-comment-tooltip').css('display', 'none');
	}
	
	function parentLinkOnMouseOver() {
		var $this = $(this);
		var $parentCommentTooltip = $this.children('.parent-comment-tooltip');
	
		if ($parentCommentTooltip.length) {
			$parentCommentTooltip.css('display', 'block');
			return;
		}
	
		var $article = $($this.closest('article'));
		var parentCommentDataId = $article.attr('data-parentid');
		var parentCommentTooltipSelector = '#parent-tooltip_' + parentCommentDataId;
		$parentCommentTooltip = $(parentCommentTooltipSelector);

		if (!$parentCommentTooltip.length) {
			createParentContextTooltip($article);
		} 
	
		$this.prepend($parentCommentTooltip);
	
		$parentCommentTooltip.css({'display': 'block'});
	}
}

function addNumberOfPendingCommentsToPendingDiscussionFilter(pendingDiscussionFilter) {
	var $pendingDiscussionFilter = $(pendingDiscussionFilter);
	var $discussionRegion = $pendingDiscussionFilter.closest('section.js_discussion-region');
	var pendingReplyCount = Number.parseInt($discussionRegion.attr('data-reply-count-pending'));
	var pendingFilterInnerText;
	
	if (isNaN(pendingReplyCount)) {
		return;
	}
	
	pendingFilterInnerText = $pendingDiscussionFilter.text() + ' (' + pendingReplyCount + ')';
	$pendingDiscussionFilter.text(pendingFilterInnerText);
}

function addScriptToPage(sourcePath) {
	if ($('head script[src*="' + sourcePath + '"]').length) {
		return;
	}
	
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = sourcePath;
	document.head.appendChild(script);
}

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
	
function commentAdded(comment) {
	if (comment.attributes.getNamedItem('depth') !== null) {
		return;
	}

	var id = comment.attributes.getNamedItem('id').value;
	var parentId = comment.attributes.getNamedItem('data-parentid').value;
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
	addAnchorToComment($comment);
	addParentCommentLinkToComment($comment);
}

function createParentContextTooltip($article) {
    var parentSelector = '#reply_' + $article.attr('data-parentid');
    var $parent = $(parentSelector); 
    
    var tooltipDivId = 'parent-tooltip_' + $parent.attr('data-id');
    var $tooltipDiv = $('#' + tooltipDivId);
    var tooltipDiv;
	var tooltipImg;
	var tooltipContentDiv;
   
	if ($tooltipDiv.length) {
    	return;
    }
    
    var parentAvatar = $parent.find('img:first')[0];
    var parentName = $parent.find('header > span.reply__byline > a.fn.url').text();
    var parentBodyText = $parent.children('div').children('p').text(); 
    var tooltipText = parentBodyText.substring(0, 30);    

    if (parentBodyText.length > 30) {
        tooltipText = tooltipText.trim() + '…';
    }                

    tooltipContentDiv = '<div>' + 
        	'<h4>' + parentName + '</h4>' +
        	'<p>' + tooltipText + '</p>' + 
        '</div>';

   
    tooltipDiv = '<div class="parent-comment-tooltip" id="' + tooltipDivId + '">' +
            '<img src="' + parentAvatar.src + '">' +
            tooltipContentDiv + 
            '</div>';
    
    $('body').append(tooltipDiv);
}

function discussionHeaderAdded(discussionHeader) {
	$(discussionHeader).append(kinjamproveButtonContainerHTML);
}
	
function kinjamproveButtonOnClick() {
	var $discussionRegion = $(this).closest('section.js_discussion-region');
	var $pendingDiscussionFilter = $(this).parent().prev().find('a[value="pending"]:first');
	
	if (!$discussionRegion.attr('kinjamprove') || $discussionRegion.attr('kinjamprove') !== 'on') {
		$pendingDiscussionFilter[0].click();
		$discussionRegion.attr('kinjamprove', 'on');
		$('.sidebar').css('display', 'none');
	} else {
		nestDiscussionRegionThreadsThatShowMoreReplies($discussionRegion);	
	}		
}

function loadAllRepliesButtonOnClick() {
    var $loadAllRepliesButton = $(this)

	window.requestAnimationFrame(nestThreadOnFinishedLoading);

    function nestThreadOnFinishedLoading() {
        var showMoreRepliesLabelText = $loadAllRepliesButton.parent()[0].innerText;

        if (showMoreRepliesLabelText.indexOf('Hide') > -1) {
            var $parentThreadFirstComment = $loadAllRepliesButton.parentsUntil('ul').children('article:first');
			nestReplies($parentThreadFirstComment);
            $parentThreadFirstComment.attr('threaded', true);

            $loadAllRepliesButton.closest('footer').remove();
        } else {
            window.requestAnimationFrame(nestThreadOnFinishedLoading);
        }
    } // end of nestThreadOnFinishedLoading function
} // end of loadAllRepliesButtonOnClick function
	
function loadMoreRepliesButtonAdded(loadMoreRepliesButtonAdded) {
	$(loadMoreRepliesButtonAdded).click(loadAllRepliesButtonOnClick);
}

function nestDiscussionRegionThreadsThatShowMoreReplies($discussionRegion) {
	var $visibleHideRepliesFooters = $discussionRegion.find('footer:parent(a.js_close-replies:visible)');
	var $depth0CommentsToRethread = $visibleHideRepliesFooters.closest('li').children('article[depth=0][threaded!="true"]');
	
	$visibleHideRepliesFooters.hide();	
			
	$depth0CommentsToRethread.each(function() {
		nestReplies(this);
		this.setAttribute('threaded', true);
	});		
}

function nestReplies($comment) {
	var comment = new Comment($comment);
	comment.attachChildrenRepliesAfter();
}

function nestThreadsWithFourOrLessReplies($discussionRegions) {
	var $hiddenFooters = $discussionRegions.find('footer:hidden');
	var $shortThreadsDepth0Comments = $hiddenFooters
									  .closest('.js_region--children')
									  .siblings('article[depth=0][threaded!="true"]');
	
	$shortThreadsDepth0Comments.each(function() {
		nestReplies(this);
		this.setAttribute('threaded', true);
	});
}

function pendingDiscussionFilterAdded(pendingDiscussionFilter) {
	addNumberOfPendingCommentsToPendingDiscussionFilter(pendingDiscussionFilter);
	$(pendingDiscussionFilter).click(pendingDiscussionFilterOnClick);
}	

function pendingDiscussionFilterOnClick() {
	var $discussionRegion;
	var animationStartTime;

	if (!$discussionRegion) {
		$discussionRegion = $(this).closest('section.js_discussion-region');
	}
	
	if ($discussionRegion.find('.alert-box:visible a').text().startsWith('Hide')) {
		console.log('Already clicked "Show Pending"');
		return;
	}

	if (!animationStartTime) {
		animationStartTime = window.performance.now();
	}
	
	window.requestAnimationFrame(function() {
		clickShowPendingButtonOnAvailable(animationStartTime);
	});

	function clickShowPendingButtonOnAvailable(animationStartTime) {
		var currentTime = window.performance.now();
		var timeElapsed = currentTime - animationStartTime;
		var $showPendingButton = $discussionRegion.find('.alert-box.filtered-view:not(".hide") .button-container > a');

		if ($showPendingButton && $showPendingButton.length) {
			$showPendingButton[0].click();
			console.log("Took " + timeElapsed + "ms to click 'Show Pending'"); 
		} else if (timeElapsed >= 5000) { 
			console.log("Canceling 'Show Pending' click b/c it was taking too long (time elapsed: " + timeElapsed + ")");
			window.cancelAnimationFrame(clickShowPendingButtonOnAvailable);
		} else {
			window.requestAnimationFrame(function() {
				clickShowPendingButtonOnAvailable(animationStartTime);
			});
		}
	} // end of clickShowPendingOnAvailable function
	
} // end of pendingDiscussionFilterOnClick function	