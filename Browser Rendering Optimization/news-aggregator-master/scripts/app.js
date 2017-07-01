/**
 *
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
APP.Main = (function() {

  var LAZY_LOAD_THRESHOLD = 300;
  var $ = document.querySelector.bind(document);

  var stories = null;
  var storyStart = 0;
  var count = 100;
  var main = $('main');
  var inDetails = false;
  var storyLoadCount = 0;
  var localeData = {
    data: {
      intl: {
        locales: 'en-US'
      }
    }
  };
  var headerCollapsed = false;

  var tmplStory = $('#tmpl-story').textContent;
  var tmplStoryDetails = $('#tmpl-story-details').textContent;
  var tmplStoryDetailsComment = $('#tmpl-story-details-comment').textContent;

  if (typeof HandlebarsIntl !== 'undefined') {
    HandlebarsIntl.registerWith(Handlebars);
  } else {

    // Remove references to formatRelative, because Intl isn't supported.
    var intlRelative = /, {{ formatRelative time }}/;
    tmplStory = tmplStory.replace(intlRelative, '');
    tmplStoryDetails = tmplStoryDetails.replace(intlRelative, '');
    tmplStoryDetailsComment = tmplStoryDetailsComment.replace(intlRelative, '');
  }

  var storyTemplate =
      Handlebars.compile(tmplStory);
  var storyDetailsTemplate =
      Handlebars.compile(tmplStoryDetails);
  var storyDetailsCommentTemplate =
      Handlebars.compile(tmplStoryDetailsComment);

  /**
   * As every single story arrives in shove its
   * content in at that exact moment. Feels like something
   * that should really be handled more delicately, and
   * probably in a requestAnimationFrame callback.
   */
  function onStoryData(key, details) {

    var storyElement = $('#s-' +  key);

    details.time *= 1000;

    var html = storyTemplate(details);

    requestAnimationFrame(function() {

      storyElement.innerHTML = html;
      storyElement.addEventListener('click', onStoryClick.bind(this, details));
      storyElement.classList.add('clickable');

      // Tick down. When zero we can batch in the next load.
      storyLoadCount--;

      // Colorize on complete.
      // if (storyLoadCount === 0)
        // colorizeAndScaleStories();

    });


    

    

    
  }

  function onStoryClick(details) {

    var storyDetails = $('#sd-detailsPane');

    // Wait a little time then show the story details.
    setTimeout(showStory.bind(this, details.id), 60);

    // console.log(storyDetails)
    // Create and append the story. A visual change...
    // perhaps that should be in a requestAnimationFrame?
    // And maybe, since they're all the same, I don't
    // need to make a new element every single time? I mean,
    // it inflates the DOM and I can only see one at once.
    if (storyDetails) {

      if (details.url)
        details.urlobj = new URL(details.url);

      var comment;
      var commentsElement;
      var storyHeader;
      var storyContent;

      var storyDetailsHtml = storyDetailsTemplate(details);
      var kids = details.kids;
      var commentHtml = storyDetailsCommentTemplate({
        by: '', text: 'Loading comment...'
      });

      storyDetails.innerHTML = storyDetailsHtml;

      storyHeader = storyDetails.querySelector('.js-header');
      storyContent = storyDetails.querySelector('.js-content');
      commentsElement = storyDetails.querySelector('.js-comments');
    
      var closeButton = storyDetails.querySelector('.js-close');
      closeButton.addEventListener('click', hideStory.bind(this, details.id));

      var headerHeight = storyHeader.getBoundingClientRect().height;
      storyContent.style.paddingTop = headerHeight + 'px';

      if (typeof kids === 'undefined')
        return;

      for (let k = 0; k < kids.length; k++) {

        requestAnimationFrame(function() {
          comment = document.createElement('aside');
          comment.setAttribute('id', 'sdc-' + kids[k]);
          comment.classList.add('story-details__comment');
          comment.innerHTML = commentHtml;
          commentsElement.appendChild(comment);
        });

        // Update the comment with the live data.
        APP.Data.getStoryComment(kids[k], function(commentDetails) {

          commentDetails.time *= 1000;

          requestAnimationFrame(function() {
            var comment = commentsElement.querySelector(
                '#sdc-' + commentDetails.id);
            comment.innerHTML = storyDetailsCommentTemplate(
                commentDetails,
                localeData);
          });

        });
      }
    }

  }

  function showStory(id) {
    if (inDetails)
      return;

    inDetails = true;

    var storyDetails = $('#sd-detailsPane');

    if (!storyDetails)
      return;

    requestAnimationFrame(function() {
      main.style.opacity = 0;
      storyDetails.style.opacity = 1;
      storyDetails.style.transform = 'translateX(0%)';
    });

  }

  function hideStory(id) {

    if (!inDetails)
      return;

    inDetails = false;

    var storyDetails = $('#sd-detailsPane');

    requestAnimationFrame(function() {
      main.style.opacity = 1;
      storyDetails.style.opacity = 0;
      storyDetails.style.transform = '';
    });


  }

  /**
   * Does this really add anything? Can we do this kind
   * of work in a cheaper way? REMOVED
   */
  function colorizeAndScaleStories() {

    var storyElements = document.querySelectorAll('.story');
    
    var height = main.offsetHeight;

    var stagedChanges = [];

    for (var s = 0; s < storyElements.length; s++) {

      var story = storyElements[s];
      var score = story.querySelector('.story__score');
      var title = story.querySelector('.story__title');

      // Base the scale on the y position of the score.
      
      var scoreLocation = score.getBoundingClientRect();

      if (scoreLocation.bottom < 86 || scoreLocation.top > height) continue;      

      var change = {
        node: story,
        score: score,
        title: title,
        scale: 1 + .2 * (1 - scoreLocation.top / height),
        opacity: .5 + .5 * (1 - scoreLocation.top / height),
        saturation: 30 + 80 * (1 - scoreLocation.top / height)
      };

      stagedChanges.push(change);
    }

    for (let c = 0; c < stagedChanges.length; c++) {
      let change = stagedChanges[c];
      requestAnimationFrame(function() {
        change.score.style.transform = `scale(${change.scale})`;
        change.score.style.backgroundColor = `hsl(42, ${change.saturation}%, 50%)`
        change.title.style.opacity = `${change.opacity}`;
      });
    }

  }

  function collapseHeader() {


    var header = $('header');


    if (main.scrollTop > 70) {
      if (!headerCollapsed) {
        header.classList.add('collapsed');
        headerCollapsed = true;
      }
    }  else {
      if (headerCollapsed) {
        header.classList.remove('collapsed');
        headerCollapsed = false;
      }
    }

  }

  main.addEventListener('scroll', function() {

    collapseHeader()

    // Add a shadow to the header.

    // colorizeAndScaleStories();

    // Check if we need to load the next batch of stories.
    var loadThreshold = (main.scrollHeight - main.offsetHeight -
        LAZY_LOAD_THRESHOLD);
    if (main.scrollTop > loadThreshold)
      loadStoryBatch();

  });

  function loadStoryBatch() {

    if (storyLoadCount > 0)
      return;

    storyLoadCount = count;

    var end = storyStart + count;
    for (let i = storyStart; i < end; i++) {

      if (i >= stories.length)
        return;

      let key = String(stories[i]);

      requestAnimationFrame(function() {
        var story = document.createElement('div');
        story.setAttribute('id', 's-' + key);
        story.classList.add('story');
        story.innerHTML = storyTemplate({
          title: '...',
          score: '-',
          by: '...',
          time: 0
        });
        main.appendChild(story);
      });

      APP.Data.getStoryById(stories[i], onStoryData.bind(this, key));
    }

    storyStart += count;

  }

  // Bootstrap in the stories.
  APP.Data.getTopStories(function(data) {
    stories = data;
    loadStoryBatch();
    main.classList.remove('loading');
  });

})();
