/*
 * This script will handle all javascript functions needed for the admin
 * pages.
 * Depends: jquery, photo.js
 */

Photo.Admin = {};
Photo.Admin.activePage = 'photo';
Photo.Admin.selectedCount = 0;
Photo.Admin.loadPage = function (resource) {
    $.getJSON(resource, function (data) {
        Photo.Admin.activePage = resource;
        Photo.Admin.selectedCount = 0;
        $("#album").html('<div class="row"></div>');
        $.each(data.albums, function (i, album) {
            href = 'photo/album/' + album.id
            $("#album").append('<div class="col-lg-3 col-md-4 col-xs-6 thumb">'
                    + '<a class="thumbnail" href="' + href + '">'
                    + '<img class="img-responsive" src="/data/photo/' + album.coverPath + '" alt="">'
                    + album.name
                    + '</a>'
                    + '</div>');
        });

        $("#album").find("a").each(function () {
            $(this).on('click', Photo.Admin.albumClicked);
        });

        $.each(data.photos, function (i, photo) {
            href = 'photo/photo/' + photo.id
            $("#album").append('<div class="col-lg-3 col-md-4 col-xs-6 thumb">'
                    + '<a class="thumbnail" href="' + href + '">'
                    + '<img class="img-responsive" src="/data/photo/' + photo.smallThumbPath + '" alt="">'
                    + '<input type="checkbox" class="thumbnail-checkbox">'
                    + '</a>'
                    + '</div>');
        });
        $("#paging").html('');

        $.each(data.pages.pagesInRange, function (key, page) {
            href = 'photo/album/' + data.album.id + '/' + page;
            if (page === data.pages.current)
            {
                $("#paging").append('<li class="active"><a href="' + href + '">' + (page) + '</a></li>');
            } else {
                $("#paging").append('<li><a href="' + href + '">' + (page) + '</a></li>');
            }
        });
        if (data.pages.previous)
        {
            href = 'photo/album/' + data.album.id + '/' + (data.pages.next);
            $("#paging").prepend('<li><a id="previous" href="' + href + '">'
                    + '<span aria-hidden="true">«</span>'
                    + '<span class="sr-only">Previous</span>'
                    + '</a></li>');
        }
        if (data.pages.next) {
            href = 'photo/album/' + data.album.id + '/' + (data.pages.next);
            $("#paging").append('<li><a id="next" href="' + href + '">'
                    + '<span aria-hidden="true">»</span>'
                    + '<span class="sr-only">Next</span>'
                    + '</a></li>');
        }

        $("#paging").find("a").each(function () {
            $(this).on('click', function (e) {
                e.preventDefault();
                Photo.Admin.loadPage(e.target.href);

            });
        });

        $(".thumbnail-checkbox").change(Photo.Admin.itemSelected);
        $("#btnAdd").attr('href', 'photo/album/' + data.album.id + '/add');
        $("#btnEdit").attr('href', 'photo/album/' + data.album.id + '/edit');
        $("#btnCreate").attr('href', 'photo/album/' + data.album.id + '/create');
    });
}

Photo.Admin.regenerateCover = function () {
    $("#coverPreview").hide();
    $("#coverSpinner").show();
    $.post(Photo.Admin.activePage + '/cover', function (data) {
        $.getJSON(Photo.Admin.activePage, function (data) {
            $("#coverPreview").attr('src', '/data/photo/' + data.album.coverPath);
            $("#coverPreview").show();
            $("#coverSpinner").hide();
        });
    });
}

Photo.Admin.deleteAlbum = function () {
    $("#deleteConfirm").hide();
    $("#deleteProgress").show();
    $.post(Photo.Admin.activePage + '/delete').done(function( data ) {
        location.reload(); //reload to update album tree (TODO: update album tree dynamically)
    });
    $("#deleteProgress").hide();
    $("#deleteDone").show();
}

Photo.Admin.deletePhoto = function () {
    $("#deleteConfirm").hide();
    $("#deleteProgress").show();
    $.post(location.href + '/delete');
    $("#deleteProgress").hide();
    $("#deleteDone").show();
}

Photo.Admin.deleteMultiple = function () {
    $("#multipleDeleteConfirm").hide();
    $("#multipleDeleteProgress").show();
    var thumbnails = [];
    $(".thumbnail-checkbox:checked").each(function() {
        thumbnails.push($(this).parent().parent());
        $.post($(this).parent().attr('href') + '/delete').done(function() {
            thumbnails.pop().remove();
        });
    });
    $("#multipleDeleteProgress").hide();
    $("#multipleDeleteDone").show();
}

Photo.Admin.moveMultiple = function () {
    $("#multipleMoveConfirm").hide();
    $("#multipleMoveProgress").show();
    var thumbnails = [];
    $(".thumbnail-checkbox:checked").each(function() {
        thumbnails.push($(this).parent().parent());
        $.post($(this).parent().attr('href') + '/move',
            { album_id : $("#newPhotoAlbum").val() }
        ).done(function() {
            thumbnails.pop().remove();
        });
    });
    $("#multipleMoveProgress").hide();
    $("#multipleMoveDone").show();
}

Photo.Admin.moveAlbum = function () {
    $("#albumMoveSelect").hide();
    $("#albumMoveProgress").show();
    $.post(
        Photo.Admin.activePage + '/move',
        { parent_id : $("#newAlbumParent").val() }
    ).done(function( data ) {
            location.reload(); //reload to update album tree (TODO: update album tree dynamically)
        });
    $("#albumMoveProgress").hide();
    $("#albumMoveDone").show();

}

Photo.Admin.movePhoto = function () {
    $("#photoMoveSelect").hide();
    $("#photoMoveProgress").show();
    $.post(
        location.href + '/move',
        { album_id : $("#newPhotoAlbum").val() }
    ).done(function( data ) {
            location.reload(); //reload to update view (TODO: update view dynamically)
        });
    $("#photoMoveProgress").hide();
    $("#photoMoveDone").show();

}

Photo.Admin.init = function () {
    $("#albumControls").hide();
    var COUNT_SPAN = '<span class="selectedCount"></span>'
    $("#btnMultipleMove").html($("#btnMultipleMove").html().replace('%i', COUNT_SPAN));
    $("#btnMultipleDelete").html($("#btnMultipleDelete").html().replace('%i', COUNT_SPAN));
    //we use class instead of id here to get the button since there are multiple instances
    $(".btn-regenerate").on('click', Photo.Admin.regenerateCover);
    $("#deleteAlbumButton").on('click', Photo.Admin.deleteAlbum);
    $("#multipleDeleteButton").on('click', Photo.Admin.deleteMultiple);
    $("#multipleMoveButton").on('click', Photo.Admin.moveMultiple);
    $("#moveAlbumButton").on('click', Photo.Admin.moveAlbum);
    //auto load album on hash
    if (location.hash !== "") {
        $(location.hash).click();
        $(location.hash).parent().parent().children().toggle();
    }
}

Photo.Admin.initPhoto = function() {
    $("#deletePhotoButton").on('click', Photo.Admin.deletePhoto);
    $("#movePhotoButton").on('click', Photo.Admin.movePhoto);
}
Photo.Admin.itemSelected = function () {
    if (this.checked) {
        Photo.Admin.selectedCount++;
    } else {
        Photo.Admin.selectedCount--;
    }
    $(".selectedCount").html(Photo.Admin.selectedCount);
    if (Photo.Admin.selectedCount > 0)
    {
        $("#btnMultipleDelete").removeClass("btn-hidden");
        $("#btnMultipleMove").removeClass("btn-hidden");
    } else {
        $("#btnMultipleDelete").addClass("btn-hidden");
        $("#btnMultipleMove").addClass("btn-hidden");
    }
}
Photo.Admin.initAdd = function () {
    $("#btnImport").click(function () {
        $.post("import",
                {
                    folder_path: $("#folderInput").val()
                },
        function (data) {
            $("#spinner").hide();
            if (data.success) {
                $("#successAlert").show();
            } else {
                $("#errorAlert").html(data.error);
                $("#errorAlert").show();
                $("#import").show();
            }
        });
        $("#errorAlert").hide();
        $("#spinner").show();
        $("#import").hide();
    });

}
Photo.Admin.updateBreadCrumb = function (target) {

    if (target.attr('class') == 'thumbnail') {
        a = target.clone();
        a.children().remove();
        a.attr('class', '');
        a.on('click', Photo.Admin.albumClicked);
        item = $("<li></li>").append(a);
        $("#breadcrumb").append(item)
    } else if (target.parent().parent().attr('id') == 'breadcrumb') {
        target.parent().nextAll().remove();
    } else {
        $("#breadcrumb").empty();
        while (!target.is('div')) {
            if (target.children('a').length > 0)
            {
                a = target.children('a').clone();
                a.on('click', Photo.Admin.albumClicked);
                item = $("<li></li>").append(a);
                $("#breadcrumb").prepend(item)
            }
            target = target.parent();
        }
    }
}
Photo.Admin.albumClicked = function (e) {
    e.preventDefault();
    //workaround for preventing page from jumping when changing hash
    if (history.pushState) {
        history.pushState(null, null, '#' + $(this).attr('id'));
    }
    else {
        location.hash = $(this).attr('id');
    }

    location.hash = $(this).attr('id');
    $("#albumControls").show();
    Photo.Admin.updateBreadCrumb($(this));
    Photo.Admin.loadPage(e.target.href);

}
$.fn.extend({
    treed: function () {
        //initialize each of the top levels
        var tree = $(this);
        tree.addClass("tree");
        tree.find('li').has("ul").each(function () {
            var branch = $(this); //li with children ul
            branch.prepend("<i class='indicator glyphicon glyphicon-plus-sign'></i>");
            branch.addClass('branch');
            branch.on('click', function (e) {
                if (this == e.target) {
                    var icon = $(this).children('i:first');
                    icon.toggleClass("glyphicon-minus-sign glyphicon-plus-sign");
                    $(this).children().children().toggle();
                }
            })
            branch.children().children().toggle();
        });
        //fire event from the dynamically added icon
        $('.branch .indicator').on('click', function () {
            $(this).closest('li').click();
        });
        //fire event to open branch if the li contains an anchor instead of text
        $('.branch>a').each(function () {
            $(this).on('click', function (e) {
                $(this).closest('li').click();
                e.preventDefault();
                // Photo.Admin.loadPage(e.target.href);
            });
        });
        tree.find("a").each(function () {
            $(this).on('click', Photo.Admin.albumClicked);
        });
    }
});


