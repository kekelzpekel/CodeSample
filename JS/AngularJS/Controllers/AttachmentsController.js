define(['lodash', 'jquery'], function (_, $) {
	'use strict';
	return [
		'$scope', '$q', 'api', 'appConf',
		function ($scope, $q, api, appConf) {

			$scope.imagesToUpload = [];
			$scope.documentsToUpload = [];
			$scope.videoActive = false;

			function fetchAttachmentsMetadata() {
				api.fetchAttachments($scope.case.caseId).success(function(data) {
					$scope.attachments = data;
					_.forEach(data, function(file) {
						if (file.mimeType === 'application/pdf') file.pdf = true;
						else file.thumbnailUrl = appConf.car.url + file.thumbnailUrl;
						file.fullUrl = appConf.car.url + file.attachmentUrl;
					});
				});
			}

			fetchAttachmentsMetadata();

			$scope.onImageSelect = function($files) {
				$scope.imagesToUpload = $scope.imagesToUpload.concat($files);
			};

			$scope.uploadImages = function() {
				var base64Objects = [];
				var regularAttachments = [];
				//check for camera
				for (var i = 0; i<$scope.imagesToUpload.length; i++) {
					if ($scope.imagesToUpload[i].camera) {
						base64Objects.push($scope.imagesToUpload[i]);
					}
					else {
						regularAttachments.push($scope.imagesToUpload[i]);
					}
				}

				var promises = [];
				if (regularAttachments.length>0) {
					promises.push(api.uploadAttachments($scope.case.caseId, regularAttachments));
				}
				if (base64Objects.length>0) {
					promises.push(api.uploadBase64($scope.case.caseId, base64Objects));
				}
				fetchAttachmentsMetadata();

				$q.all(promises).finally(function() {
					$scope.imagesToUpload = [];
					regularAttachments = [];
					base64Objects = [];
					fetchAttachmentsMetadata();
				});
			};

			$scope.removeImage = function(index) {
				api.deleteAttachment($scope.case.caseId, $scope.attachments[index].attachmentId)
					.success(function() {
						$scope.attachments.splice(index, 1);
						fetchAttachmentsMetadata();
					});
			};

			var video = $('video')[0];
			var localMediaStream = null;

			$scope.snapshot = function snapshot() {
				var canvas = $('canvas')[0];
				var ctx = canvas.getContext('2d');
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				if (localMediaStream) {
					ctx.drawImage(video, 0, 0);
					$scope.imagesToUpload.push(
						{
							'base64': canvas.toDataURL(),
							'name': 'photo'+Math.random() +'.png',
							'camera': true
						});
				}
			};

			$scope.toggleCamera = function () {
				$scope.videoActive = true;
				video.addEventListener('click', $scope.snapshot, false);
				navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
				navigator.getUserMedia(
					{video: true},
					function (stream) {
						video.src = window.URL.createObjectURL(stream);
						localMediaStream = stream;
					},
					function () {}
				);
			};
		}
	];
});